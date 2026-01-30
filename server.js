/**
 * A Node.js server that uses Express with PostgreSQL/SQLite to create an API for managing notes.
 * Includes endpoints for retrieving all notes, adding a new note, and deleting a note.
 *
 * @module NoteAPI
 */

require("dotenv").config();

const Express = require("express");
const cors = require("cors");
const WebSocket = require("ws");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const path = require("path");
const { testConnection, sequelize } = require("./config/database");
const dbService = require("./services/databaseService");
const Note = require("./models/Note");
const deadlineService = require("./services/deadlineService");
const newsService = require("./services/newsService");
const financialService = require("./services/financialService");
const predictiveMarketsService = require("./services/predictiveMarketsService");
const twitterService = require("./services/twitterService");
const nyuziService = require("./services/nyuziService");
const intelligenceService = require("./services/intelligenceService");
const calendarService = require("./services/calendarService");
const emailService = require("./services/emailService");
const cloudStorageService = require("./services/cloudStorageService");
const taskService = require("./services/taskService");
const cron = require("node-cron");

const app = Express();

// Security middleware (disable CSP so CRA inline runtime can load)
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(Express.json({ limit: "10mb" }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use("/api/", limiter);

// Serve static frontend (build) for Heroku/single-app deploys
const buildPath = path.join(__dirname, "build");
app.use(Express.static(buildPath));

// Initialize database and start server (Railway/Render/etc. provide PORT)
const PORT = process.env.PORT || 3050;
const server = app.listen(PORT, async () => {
  try {
    // Test database connection
    const connected = await testConnection();
    
    if (connected) {
      // Sync database (create tables if they don't exist)
      await dbService.syncDatabase(false);
      console.log("Database initialized successfully");
    }
  } catch (error) {
    console.error("Failed to initialize database", error);
  }
  console.log(`Server Started on port ${PORT}\n`);
});

// WebSocket server for real-time updates
// Attach WS to same HTTP server so platforms with a single exposed port (e.g. Railway/Heroku) work.
const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
  console.log("WebSocket client connected");

  ws.on("message", async (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === "subscribe") {
        // Client subscribes to note updates
        ws.send(JSON.stringify({ type: "subscribed", message: "Subscribed to note updates" }));
      }
  } catch (error) {
      console.error("WebSocket error:", error);
    }
  });

  ws.on("close", () => {
    console.log("WebSocket client disconnected");
  });
});

// Broadcast function to notify all connected clients
function broadcastNoteUpdate(updateType, noteData) {
  const message = JSON.stringify({
    type: "note_update",
    updateType: updateType, // 'created', 'updated', 'deleted'
    data: noteData
  });
  
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Helper function to sort notes
function sortNotes(notes, sortBy, sortOrder) {
  const sortDirection = sortOrder === 'asc' ? 1 : -1;
  
  notes.sort((a, b) => {
    if (sortBy === 'title') {
      return sortDirection * (a.title || '').localeCompare(b.title || '');
    } else if (sortBy === 'createdAt') {
      return sortDirection * (new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortBy === 'updatedAt') {
      return sortDirection * (new Date(a.updatedAt || a.createdAt) - new Date(b.updatedAt || b.createdAt));
    } else if (sortBy === 'priority') {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      return sortDirection * (priorityOrder[a.priority] - priorityOrder[b.priority]);
    }
    return 0;
  });
  
  // Sort pinned notes first
  notes.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return 0;
  });
  
  return notes;
}

/**
 * Endpoint for retrieving all notes/ the get request.
 */
app.get('/api/notes/GetNotes', async (request, response) => {
  try {
    const { tags, priority, isArchived, isPinned, sortBy = 'updatedAt', sortOrder = 'desc' } = request.query;
    
    let filters = {};
    
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      filters.tags = tagArray;
    }
    
    if (priority) {
      filters.priority = priority;
    }
    
    if (isArchived !== undefined) {
      filters.isArchived = isArchived === 'true';
    }
    
    if (isPinned !== undefined) {
      filters.isPinned = isPinned === 'true';
    }
    
    let notes = await dbService.getNotes(filters);
    
    // Convert Sequelize models to plain objects and normalize IDs
    notes = notes.map(note => {
      const noteJson = note.toJSON();
      // Normalize id to _id for frontend compatibility
      noteJson._id = noteJson.id;
      return noteJson;
    });
    
    // Sorting
    notes = sortNotes(notes, sortBy, sortOrder);
    
    response.send(notes);
  } catch (error) {
    console.error("Error sending notes", error);
    response.status(500).send({ message: "Internal Server Error" });
  }
});

/**
 * Endpoint for adding a new note.
 */
app.post('/api/notes/AddNote', async (request, response) => {
  try {
    const newNote = await dbService.createNote(request.body);
    const noteJson = newNote.toJSON();
    // Normalize id to _id for frontend compatibility
    noteJson._id = noteJson.id;
    broadcastNoteUpdate("created", noteJson);
    response.status(201).send(noteJson);
  } catch (error) {
    console.error("Error adding note", error);
    response.status(500).send({ message: "Internal Server Error" });
  }
});

/**
 * Helper function to get ID from request (handles both _id and id, and string/integer)
 */
function getIdFromRequest(request) {
  const id = request.params.id || request.body.id || request.body._id;
  // Handle both string and integer IDs
  const parsedId = typeof id === 'string' ? parseInt(id) : id;
  if (isNaN(parsedId)) {
    throw new Error("Invalid ID format");
  }
  return parsedId;
}

/**
 * Endpoint for updating a note.
 */
app.put('/api/notes/UpdateNote/:id', async (request, response) => {
  try {
    const id = getIdFromRequest(request);
    const updatedNote = await dbService.updateNote(id, request.body);
    
    if (!updatedNote) {
      return response.status(404).send({ message: "Note not found" });
    }
    
    const noteJson = updatedNote.toJSON();
    // Normalize id to _id for frontend compatibility
    noteJson._id = noteJson.id;
    broadcastNoteUpdate("updated", noteJson);
    response.json(noteJson);
  } catch (error) {
    console.error("Error updating note", error);
    response.status(500).send({ message: "Internal Server Error" });
  }
});

/**
 * Endpoint for searching notes.
 */
app.get('/api/notes/search', async (request, response) => {
  try {
    const { q, tags, priority, isArchived, isPinned, sortBy = 'updatedAt', sortOrder = 'desc' } = request.query;
    
    let filters = {};
    
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      filters.tags = tagArray;
    }
    
    if (priority) {
      filters.priority = priority;
    }
    
    if (isArchived !== undefined) {
      filters.isArchived = isArchived === 'true';
    }
    
    if (isPinned !== undefined) {
      filters.isPinned = isPinned === 'true';
    }
    
    let notes;
    if (q) {
      notes = await dbService.searchNotes(q, filters);
    } else {
      notes = await dbService.getNotes(filters);
    }
    
    // Convert Sequelize models to plain objects and normalize IDs
    notes = notes.map(note => {
      const noteJson = note.toJSON();
      // Normalize id to _id for frontend compatibility
      noteJson._id = noteJson.id;
      return noteJson;
    });
    
    // Sorting
    notes = sortNotes(notes, sortBy, sortOrder);
    
    response.json(notes);
  } catch (error) {
    console.error("Error searching notes", error);
    response.status(500).send({ message: "Internal Server Error" });
  }
});

/**
 * Endpoint for pinning/unpinning a note.
 */
app.patch('/api/notes/:id/pin', async (request, response) => {
  try {
    const id = getIdFromRequest(request);
    const { isPinned } = request.body;
    
    const updatedNote = await dbService.updateNote(id, { isPinned });
    
    if (!updatedNote) {
      return response.status(404).send({ message: "Note not found" });
    }
    
    response.json({ message: `Note ${isPinned ? 'pinned' : 'unpinned'} successfully` });
  } catch (error) {
    console.error("Error pinning note", error);
    response.status(500).send({ message: "Internal Server Error" });
  }
});

/**
 * Endpoint for archiving/unarchiving a note.
 */
app.patch('/api/notes/:id/archive', async (request, response) => {
  try {
    const id = getIdFromRequest(request);
    const { isArchived } = request.body;
    
    const updatedNote = await dbService.updateNote(id, { isArchived });
    
    if (!updatedNote) {
      return response.status(404).send({ message: "Note not found" });
    }
    
    response.json({ message: `Note ${isArchived ? 'archived' : 'unarchived'} successfully` });
  } catch (error) {
    console.error("Error archiving note", error);
    response.status(500).send({ message: "Internal Server Error" });
  }
});

/**
 * Endpoint for getting all tags.
 */
app.get('/api/notes/tags', async (request, response) => {
  try {
    const tags = await dbService.getAllTags();
    response.json(tags);
  } catch (error) {
    console.error("Error getting tags", error);
    response.status(500).send({ message: "Internal Server Error" });
  }
});

/**
 * Endpoint for getting archived notes.
 */
app.get('/api/notes/archived', async (request, response) => {
  try {
    const notes = await dbService.getArchivedNotes();
    const notesJson = notes.map(note => {
      const noteJson = note.toJSON();
      noteJson._id = noteJson.id;
      return noteJson;
    });
    response.json(notesJson);
  } catch (error) {
    console.error("Error getting archived notes", error);
    response.status(500).send({ message: "Internal Server Error" });
  }
});

/**
 * Endpoint for soft delete (trash).
 */
app.patch('/api/notes/:id/trash', async (request, response) => {
  try {
    const id = getIdFromRequest(request);
    const { isDeleted } = request.body;
    
    const updateData = {
      isDeleted: isDeleted,
      updatedAt: new Date()
    };
    
    if (isDeleted) {
      updateData.deletedAt = new Date();
    } else {
      updateData.deletedAt = null;
    }
    
    const updatedNote = await dbService.updateNote(id, updateData);
    
    if (!updatedNote) {
      return response.status(404).send({ message: "Note not found" });
    }
    
    response.json({ message: `Note ${isDeleted ? 'moved to trash' : 'restored'} successfully` });
  } catch (error) {
    console.error("Error trashing note", error);
    response.status(500).send({ message: "Internal Server Error" });
  }
});

/**
 * Endpoint for getting trashed notes.
 */
app.get('/api/notes/trash', async (request, response) => {
  try {
    const notes = await dbService.getTrashedNotes();
    const notesJson = notes.map(note => {
      const noteJson = note.toJSON();
      noteJson._id = noteJson.id;
      return noteJson;
    });
    response.json(notesJson);
  } catch (error) {
    console.error("Error getting trashed notes", error);
    response.status(500).send({ message: "Internal Server Error" });
  }
});

/**
 * Endpoint for deleting a note (permanent delete).
 */
app.delete('/api/notes/DeleteNote/:id', async (request, response) => {
 try {
    const id = getIdFromRequest(request);
    const deleted = await dbService.deleteNote(id);
    
    if (deleted) {
      broadcastNoteUpdate("deleted", { id });
      response.send({ message: "Note deleted successfully" });
    } else {
      response.status(404).send({ message: "Note not found" });
    }
 } catch (error) {
    console.error("Error deleting note", error);
    response.status(500).send({ message: "Internal Server Error" });
 }
});

/**
 * Endpoint for exporting all notes as JSON.
 */
app.get('/api/notes/export', async (request, response) => {
  try {
    const notes = await dbService.getNotes();
    const notesJson = notes.map(note => {
      const noteJson = note.toJSON();
      noteJson._id = noteJson.id;
      return noteJson;
    });
    response.setHeader('Content-Type', 'application/json');
    response.setHeader('Content-Disposition', `attachment; filename=notes-export-${new Date().toISOString().split('T')[0]}.json`);
    response.json(notesJson);
  } catch (error) {
    console.error("Error exporting notes", error);
    response.status(500).send({ message: "Internal Server Error" });
  }
});

/**
 * Endpoint for importing notes from JSON.
 */
app.post('/api/notes/import', async (request, response) => {
  try {
    const { notes } = request.body;
    
    if (!Array.isArray(notes)) {
      return response.status(400).send({ message: "Invalid format. Expected an array of notes." });
    }

    let importedCount = 0;
    for (const note of notes) {
      try {
        await dbService.createNote({
          title: note.title || "",
          content: note.content || "",
          tags: note.tags || [],
          priority: note.priority || "medium",
          isPinned: note.isPinned || false,
          isArchived: note.isArchived || false
        });
        importedCount++;
      } catch (error) {
        console.error("Error importing note:", error);
      }
    }
    
    response.json({
      message: `Successfully imported ${importedCount} notes`,
      count: importedCount
    });
  } catch (error) {
    console.error("Error importing notes", error);
    response.status(500).send({ message: "Internal Server Error" });
  }
});

/**
 * Templates endpoints
 */
app.get('/api/templates', async (request, response) => {
  try {
    const templates = [
      {
        id: 'meeting',
        name: 'Meeting Notes',
        title: 'Meeting: {{topic}}',
        content: 'Date: {{date}}\nAttendees: {{attendees}}\n\nAgenda:\n- \n- \n\nNotes:\n\nAction Items:\n- ',
        tags: ['meeting', 'work']
      },
      {
        id: 'project',
        name: 'Project Plan',
        title: 'Project: {{name}}',
        content: 'Project: {{name}}\nStart Date: {{startDate}}\nDeadline: {{deadline}}\n\nObjectives:\n- \n- \n\nTasks:\n- [ ] \n- [ ] \n\nNotes:\n',
        tags: ['project', 'planning']
      },
      {
        id: 'todo',
        name: 'To-Do List',
        title: 'To-Do: {{date}}',
        content: 'To-Do List for {{date}}\n\n- [ ] \n- [ ] \n- [ ] \n\nCompleted:\n- ',
        tags: ['todo', 'tasks']
      },
      {
        id: 'journal',
        name: 'Journal Entry',
        title: 'Journal: {{date}}',
        content: 'Date: {{date}}\n\nToday I...\n\nThoughts:\n\nGratitude:\n- \n- ',
        tags: ['journal', 'personal']
      }
    ];
    response.json(templates);
  } catch (error) {
    console.error("Error fetching templates", error);
    response.status(500).send({ message: "Internal Server Error" });
  }
});

// ==================== PHASE 2: INTEGRATION ENDPOINTS ====================

/**
 * Deadline endpoints
 */
app.get('/api/notes/upcoming-deadlines', async (request, response) => {
  try {
    const { days = 7 } = request.query;
    const deadlines = await deadlineService.getUpcomingDeadlines(parseInt(days));
    const notesJson = deadlines.map(note => {
      const json = note.toJSON();
      json._id = json.id;
      return json;
    });
    response.json(notesJson);
  } catch (error) {
    console.error("Error getting upcoming deadlines", error);
    response.status(500).send({ message: "Internal Server Error" });
  }
});

app.get('/api/notes/overdue', async (request, response) => {
  try {
    const overdue = await deadlineService.getOverdueNotes();
    const notesJson = overdue.map(note => {
      const json = note.toJSON();
      json._id = json.id;
      return json;
    });
    response.json(notesJson);
  } catch (error) {
    console.error("Error getting overdue notes", error);
    response.status(500).send({ message: "Internal Server Error" });
  }
});

app.patch('/api/notes/:id/deadline-status', async (request, response) => {
  try {
    const id = getIdFromRequest(request);
    const { status } = request.body;
    const note = await dbService.getNoteById(id);
    
    if (!note) {
      return response.status(404).send({ message: "Note not found" });
    }
    
    const noteData = note.toJSON();
    const updatedNote = await dbService.updateNote(id, {
      deadline: {
        ...noteData.deadline,
        status: status
      }
    });
    
    response.json({ message: "Deadline status updated" });
  } catch (error) {
    console.error("Error updating deadline status", error);
    response.status(500).send({ message: "Internal Server Error" });
  }
});

/**
 * News endpoints
 */
app.post('/api/notes/:id/fetch-news', async (request, response) => {
  try {
    const id = getIdFromRequest(request);
    const note = await dbService.getNoteById(id);

    if (!note) {
      return response.status(404).send({ message: "Note not found" });
    }

    const noteData = note.toJSON();
    const hasNewsConfig = noteData.news && noteData.news.enabled && noteData.news.keywords && noteData.news.keywords.length > 0;
    if (!hasNewsConfig) {
      return response.status(400).json({
        message: "Note has no news keywords. When creating or editing the note, expand Integrations, check News, and add keywords (e.g. technology, AI), then save. Then click Fetch news.",
        code: "NO_NEWS_CONFIG"
      });
    }

    const articles = await newsService.fetchNewsForNote(noteData);
    const sentiment = articles.length > 0 ? intelligenceService.analyzeNewsSentiment(articles) : null;

    await dbService.updateNote(id, {
      news: {
        ...noteData.news,
        articles: articles,
        sentiment: sentiment,
        lastFetched: new Date()
      }
    });

    response.json({ articles, count: articles.length, sentiment });
  } catch (error) {
    console.error("Error fetching news", error);
    response.status(500).send({ message: "Internal Server Error" });
  }
});

app.get('/api/notes/:id/news', async (request, response) => {
  try {
    const id = getIdFromRequest(request);
    const note = await dbService.getNoteById(id);
    
    if (!note) {
      return response.status(404).send({ message: "Note not found" });
    }
    
    const noteData = note.toJSON();
    response.json({ articles: noteData.news?.articles || [] });
  } catch (error) {
    console.error("Error getting news", error);
    response.status(500).send({ message: "Internal Server Error" });
  }
});

/**
 * Financial endpoints
 */
app.post('/api/notes/:id/update-financial', async (request, response) => {
  try {
    const id = getIdFromRequest(request);
    const note = await dbService.getNoteById(id);

    if (!note) {
      return response.status(404).send({ message: "Note not found" });
    }

    const noteData = note.toJSON();
    const hasFinancialConfig = noteData.financial && noteData.financial.enabled && noteData.financial.symbols && noteData.financial.symbols.length > 0;
    if (!hasFinancialConfig) {
      return response.status(400).json({
        message: "Note has no financial symbols. When creating or editing the note, expand Integrations, check Financial, pick type (Crypto/Stocks), and add symbols (e.g. BTC, ETH or AAPL, TSLA), then save. Then click Update financial.",
        code: "NO_FINANCIAL_CONFIG"
      });
    }

    // Default to crypto when type missing so CoinGecko (no API key) is used for BTC, ETH, etc.
    const financialType = noteData.financial.type || "crypto";
    let prices = [];
    if (financialType === "stock" && noteData.financial.symbols) {
      prices = await financialService.fetchStockPrices(noteData.financial.symbols);
    } else if (noteData.financial.symbols) {
      prices = await financialService.fetchCryptoPrices(noteData.financial.symbols);
    }

    await dbService.updateNote(id, {
      financial: {
        ...noteData.financial,
        type: financialType,
        data: {
          ...noteData.financial?.data,
          prices: prices
        },
        lastUpdated: new Date()
      }
    });

    response.json({ prices, updatedAt: new Date() });
  } catch (error) {
    console.error("Error updating financial data", error);
    response.status(500).send({ message: "Internal Server Error" });
  }
});

app.get('/api/notes/:id/financial-summary', async (request, response) => {
  try {
    const id = getIdFromRequest(request);
    const note = await dbService.getNoteById(id);
    
    if (!note) {
      return response.status(404).send({ message: "Note not found" });
    }
    
    const noteData = note.toJSON();
    response.json({
      type: noteData.financial?.type,
      lastUpdated: noteData.financial?.lastUpdated,
      prices: noteData.financial?.data?.prices || []
    });
  } catch (error) {
    console.error("Error getting financial summary", error);
    response.status(500).send({ message: "Internal Server Error" });
  }
});

/**
 * Predictive Markets endpoints
 */
app.get('/api/predictive/search', async (request, response) => {
  try {
    const { q } = request.query;
    const markets = await predictiveMarketsService.searchMarkets(q);
    response.json({ markets });
  } catch (error) {
    console.error("Error searching predictive markets", error);
    response.status(500).send({ message: "Internal Server Error" });
  }
});

app.post('/api/notes/:id/link-predictive-market', async (request, response) => {
  try {
    const id = getIdFromRequest(request);
    const { marketId, platform } = request.body;
    const note = await dbService.getNoteById(id);
    
    if (!note) {
      return response.status(404).send({ message: "Note not found" });
    }
    
    const noteData = note.toJSON();
    let marketData = null;
    
    switch (platform) {
      case 'polymarket':
        marketData = await predictiveMarketsService.fetchPolymarketData(marketId);
        break;
      case 'kalshi':
        marketData = await predictiveMarketsService.fetchKalshiMarketData(marketId);
        break;
      case 'predictit':
        marketData = await predictiveMarketsService.fetchPredictItMarketData(marketId);
        break;
    }
    
    if (!marketData) {
      return response.status(400).send({ message: "Invalid platform or market ID" });
    }
    
    const markets = noteData.financial?.predictive?.markets || [];
    markets.push(marketData);
    
    await dbService.updateNote(id, {
      financial: {
        ...noteData.financial,
        type: noteData.financial?.type || 'predictive',
        predictive: {
          ...noteData.financial?.predictive,
          markets: markets
        }
      }
    });
    
    response.json({ message: "Market linked successfully", market: marketData });
  } catch (error) {
    console.error("Error linking predictive market", error);
    response.status(500).send({ message: "Internal Server Error" });
  }
});

/**
 * Twitter/X endpoints
 */
app.post('/api/notes/:id/fetch-tweets', async (request, response) => {
  try {
    const id = getIdFromRequest(request);
    const note = await dbService.getNoteById(id);
    
    if (!note) {
      return response.status(404).send({ message: "Note not found" });
    }
    
    const noteData = note.toJSON();
    const keywords = noteData.social?.x?.keywords || [];

    if (keywords.length === 0) {
      return response.status(400).json({
        message: "Note has no X/social keywords. When creating or editing the note, expand Integrations, check X / Social keywords, and add keywords (e.g. crypto, tech), then save. Then click Fetch tweets.",
        code: "NO_SOCIAL_CONFIG"
      });
    }

    const tweetData = await twitterService.searchTweets(keywords, { maxResults: 50 });
    const sentiment = twitterService.analyzeSentiment(tweetData.tweets);
    
    await dbService.updateNote(id, {
      social: {
        ...noteData.social,
        x: {
          ...noteData.social?.x,
          tweets: tweetData.tweets,
          sentiment: sentiment,
          lastFetched: new Date()
        }
      }
    });
    
    response.json({ tweets: tweetData.tweets, sentiment });
  } catch (error) {
    console.error("Error fetching tweets", error);
    response.status(500).send({ message: "Internal Server Error" });
  }
});

app.get('/api/notes/:id/tweets', async (request, response) => {
  try {
    const id = getIdFromRequest(request);
    const note = await dbService.getNoteById(id);
    
    if (!note) {
      return response.status(404).send({ message: "Note not found" });
    }
    
    const noteData = note.toJSON();
    response.json({ tweets: noteData.social?.x?.tweets || [] });
  } catch (error) {
    console.error("Error getting tweets", error);
    response.status(500).send({ message: "Internal Server Error" });
  }
});

/**
 * Nyuzi endpoints
 */
app.get('/api/nyuzi/search', async (request, response) => {
  try {
    const { q } = request.query;
    const markets = await nyuziService.searchMarkets(q);
    response.json({ markets });
  } catch (error) {
    console.error("Error searching Nyuzi", error);
    response.status(500).send({ message: "Internal Server Error" });
  }
});

app.get('/api/nyuzi/market/:marketId', async (request, response) => {
  try {
    const { marketId } = request.params;
    const intelligence = await nyuziService.getMarketIntelligence(marketId);
    response.json(intelligence);
  } catch (error) {
    console.error("Error getting Nyuzi market", error);
    response.status(500).send({ message: "Internal Server Error" });
  }
});

app.post('/api/notes/:id/nyuzi-market', async (request, response) => {
  try {
    const id = getIdFromRequest(request);
    const { marketId } = request.body;
    const note = await dbService.getNoteById(id);
    
    if (!note) {
      return response.status(404).send({ message: "Note not found" });
    }
    
    const noteData = note.toJSON();
    const intelligence = await nyuziService.getMarketIntelligence(marketId);
    const comparison = await nyuziService.getCrossPlatformComparison(noteData.title);
    
    await dbService.updateNote(id, {
      financial: {
        ...noteData.financial,
        type: noteData.financial?.type || 'predictive',
        predictive: {
          ...noteData.financial?.predictive,
          nyuzi: {
            enabled: true,
            marketIds: [marketId],
            crossPlatform: comparison,
            catalysts: intelligence.catalysts,
            traderBehavior: intelligence.traderBehavior,
            earlyMarketIndicator: intelligence.earlyMarketIndicator
          }
        }
      }
    });
    
    response.json({ message: "Nyuzi market linked", intelligence });
  } catch (error) {
    console.error("Error linking Nyuzi market", error);
    response.status(500).send({ message: "Internal Server Error" });
  }
});

/**
 * Intelligence endpoints
 */
app.post('/api/notes/:id/update-all', async (request, response) => {
  try {
    const id = getIdFromRequest(request);
    const note = await dbService.getNoteById(id);
    
    if (!note) {
      return response.status(404).send({ message: "Note not found" });
    }
    
    const noteData = note.toJSON();
    const updates = {};
    
    // Update news
    if (noteData.news?.enabled) {
      const articles = await newsService.fetchNewsForNote(noteData);
      const newsSentiment = articles.length > 0 ? intelligenceService.analyzeNewsSentiment(articles) : null;
      updates.news = {
        ...noteData.news,
        articles: articles,
        sentiment: newsSentiment,
        lastFetched: new Date()
      };
    }
    
    // Update financial
    if (noteData.financial?.enabled && noteData.financial?.symbols?.length) {
      let prices = [];
      if (noteData.financial.type === 'stock') {
        prices = await financialService.fetchStockPrices(noteData.financial.symbols);
      } else if (noteData.financial.type === 'crypto') {
        prices = await financialService.fetchCryptoPrices(noteData.financial.symbols);
      }
      if (prices.length > 0) {
        updates.financial = {
          ...noteData.financial,
          data: { ...noteData.financial.data, prices: prices },
          lastUpdated: new Date()
        };
      }
    }
    
    // Update Twitter
    if (noteData.social?.x?.enabled) {
      const keywords = noteData.social.x.keywords || [];
      if (keywords.length > 0) {
        const tweetData = await twitterService.searchTweets(keywords);
        const sentiment = twitterService.analyzeSentiment(tweetData.tweets);
        updates.social = {
          ...noteData.social,
          x: {
            ...noteData.social.x,
            tweets: tweetData.tweets,
            sentiment: sentiment,
            lastFetched: new Date()
          }
        };
      }
    }
    
    // Generate intelligence
    const tempNote = { ...noteData, ...updates };
    const intelligence = await intelligenceService.generateCrossDomainIntelligence(tempNote);
    updates.intelligence = intelligence;
    
    await dbService.updateNote(id, updates);
    
    response.json({ message: "All integrations updated", intelligence });
  } catch (error) {
    console.error("Error updating all integrations", error);
    response.status(500).send({ message: "Internal Server Error" });
  }
});

app.get('/api/notes/:id/intelligence', async (request, response) => {
  try {
    const id = getIdFromRequest(request);
    const note = await dbService.getNoteById(id);
    
    if (!note) {
      return response.status(404).send({ message: "Note not found" });
    }
    
    const noteData = note.toJSON();
    const intelligence = await intelligenceService.generateCrossDomainIntelligence(noteData);
    response.json(intelligence);
  } catch (error) {
    console.error("Error getting intelligence", error);
    response.status(500).send({ message: "Internal Server Error" });
  }
});

// ==================== PHASE 5: ADDITIONAL INTEGRATIONS ====================

/**
 * Calendar endpoints
 */
app.get('/api/calendar/events', async (request, response) => {
  try {
    const { timeMin, timeMax } = request.query;
    const events = await calendarService.getEvents(timeMin, timeMax);
    response.json(events);
  } catch (error) {
    console.error("Error getting calendar events", error);
    response.status(500).send({ message: "Internal Server Error" });
  }
});

app.post('/api/notes/:id/create-calendar-event', async (request, response) => {
  try {
    const id = getIdFromRequest(request);
    const note = await dbService.getNoteById(id);
    
    if (!note) {
      return response.status(404).send({ message: "Note not found" });
    }
    
    const noteData = note.toJSON();
    const event = await calendarService.createEventFromNote(noteData);
    response.json({ message: "Calendar event created", event });
  } catch (error) {
    console.error("Error creating calendar event", error);
    response.status(500).send({ message: error.message || "Internal Server Error" });
  }
});

/**
 * Email endpoints
 */
app.post('/api/email/parse', async (request, response) => {
  try {
    const parsed = emailService.parseEmail(request.body);
    response.json(parsed);
  } catch (error) {
    console.error("Error parsing email", error);
    response.status(500).send({ message: "Internal Server Error" });
  }
});

app.post('/api/email/to-note', async (request, response) => {
  try {
    const note = emailService.emailToNote(request.body);
    const created = await dbService.createNote(note);
    const noteJson = created.toJSON();
    noteJson._id = noteJson.id;
    response.status(201).json(noteJson);
  } catch (error) {
    console.error("Error converting email to note", error);
    response.status(500).send({ message: "Internal Server Error" });
  }
});

/**
 * Cloud Storage endpoints
 */
app.get('/api/cloud/:provider/files', async (request, response) => {
  try {
    const { provider } = request.params;
    const { folderId } = request.query;
    const files = await cloudStorageService.listFiles(provider, folderId);
    response.json({ files });
  } catch (error) {
    console.error("Error getting cloud files", error);
    response.status(500).send({ message: "Internal Server Error" });
  }
});

/**
 * Task Management endpoints
 */
app.post('/api/tasks/:platform/create', async (request, response) => {
  try {
    const { platform } = request.params;
    const { noteId } = request.body;
    
    const note = await dbService.getNoteById(parseInt(noteId));
    if (!note) {
      return response.status(404).send({ message: "Note not found" });
    }
    
    const noteData = note.toJSON();
    const taskData = taskService.noteToTask(noteData, platform);
    const task = await taskService.createTask(taskData, platform);
    
    response.json({ message: "Task created", task });
  } catch (error) {
    console.error("Error creating task", error);
    response.status(500).send({ message: "Internal Server Error" });
  }
});

// Catch-all to serve React app (non-API routes)
app.get("*", (request, response) => {
  if (request.path.startsWith("/api")) {
    return response.status(404).json({ message: "Not found" });
  }
  response.sendFile(path.join(buildPath, "index.html"));
});

// ==================== CRON JOBS ====================

// Check deadlines every hour
cron.schedule('0 * * * *', async () => {
  try {
    const overdue = await deadlineService.getOverdueNotes();
    const upcoming = await deadlineService.getUpcomingDeadlines(24);
    
    // Send reminders for upcoming deadlines
    for (const note of upcoming) {
      const noteData = note.toJSON();
      if (noteData.deadline?.reminder?.enabled) {
        await deadlineService.sendReminder(noteData);
      }
    }
  } catch (error) {
    console.error("Error in deadline cron job", error);
  }
});

// Update financial data every 5 minutes during market hours (9 AM - 4 PM, Mon-Fri)
cron.schedule('*/5 9-16 * * 1-5', async () => {
  try {
    const dbService = require("./services/databaseService");
    const notes = await dbService.getNotes({ isDeleted: { $ne: true } });
    
    for (const note of notes) {
      const noteData = note.toJSON();
      if (noteData.financial?.enabled && noteData.financial?.symbols) {
        try {
          let prices = [];
          if (noteData.financial.type === 'stock') {
            prices = await financialService.fetchStockPrices(noteData.financial.symbols);
          } else if (noteData.financial.type === 'crypto') {
            prices = await financialService.fetchCryptoPrices(noteData.financial.symbols);
          }
          
          await dbService.updateNote(noteData.id, {
            financial: {
              ...noteData.financial,
              data: { ...noteData.financial.data, prices: prices },
              lastUpdated: new Date()
            }
          });
        } catch (error) {
          console.error(`Error updating financial data for note ${noteData.id}:`, error);
        }
      }
    }
  } catch (error) {
    console.error("Error in financial update cron job", error);
  }
});

// Fetch news daily
cron.schedule('0 9 * * *', async () => {
  try {
    const dbService = require("./services/databaseService");
    const notes = await dbService.getNotes({ isDeleted: { $ne: true } });
    
    for (const note of notes) {
      const noteData = note.toJSON();
      if (noteData.news?.enabled) {
        try {
          const articles = await newsService.fetchNewsForNote(noteData);
          await dbService.updateNote(noteData.id, {
            news: {
              ...noteData.news,
              articles: articles,
              lastFetched: new Date()
            }
          });
        } catch (error) {
          console.error(`Error updating news for note ${noteData.id}:`, error);
        }
      }
    }
  } catch (error) {
    console.error("Error in news update cron job", error);
  }
});

console.log("Cron jobs initialized");
