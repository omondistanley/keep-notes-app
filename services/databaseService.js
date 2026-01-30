const Note = require("../models/Note");
const Notification = require("../models/Notification");
const { Op } = require("sequelize");
const { sequelize } = require("../config/database");

/**
 * Database service abstraction layer
 * Provides a unified interface for database operations
 */

class DatabaseService {
  /**
   * Get all notes with optional filters
   */
  async getNotes(filters = {}) {
    const where = {
      isDeleted: { [Op.ne]: true }
    };

    // Handle tag filtering - check if tags array contains any of the filter tags
    if (filters.tags && Array.isArray(filters.tags) && filters.tags.length > 0) {
      // For both PostgreSQL and SQLite, we use JSON path queries
      const tagConditions = filters.tags.map(tag => 
        sequelize.where(
          sequelize.fn('json_extract', sequelize.col('tags'), '$'),
          { [Op.like]: `%${tag}%` }
        )
      );
      where[Op.or] = tagConditions;
    }

    if (filters.priority) {
      where.priority = filters.priority;
    }

    if (filters.isArchived !== undefined) {
      where.isArchived = filters.isArchived;
    }

    if (filters.isPinned !== undefined) {
      where.isPinned = filters.isPinned;
    }

    // Get all notes and filter tags in JavaScript for better compatibility
    let notes = await Note.findAll({ where });
    
    // Additional tag filtering in JavaScript for better compatibility
    if (filters.tags && Array.isArray(filters.tags) && filters.tags.length > 0) {
      notes = notes.filter(note => {
        const noteTags = note.tags || [];
        return filters.tags.some(filterTag => noteTags.includes(filterTag));
      });
    }

    return notes;
  }

  /**
   * Search notes by query string
   */
  async searchNotes(query, filters = {}) {
    const where = {
      isDeleted: { [Op.ne]: true }
    };

    // Text search - use case-insensitive search
    const searchTerm = query.toLowerCase();
    const searchConditions = [
      sequelize.where(
        sequelize.fn('LOWER', sequelize.col('title')),
        { [Op.like]: `%${searchTerm}%` }
      ),
      sequelize.where(
        sequelize.fn('LOWER', sequelize.col('content')),
        { [Op.like]: `%${searchTerm}%` }
      )
    ];

    // Get all notes first, then filter in JavaScript for tag search
    let notes = await Note.findAll({ where });
    
    // Filter by search query
    notes = notes.filter(note => {
      const titleMatch = (note.title || '').toLowerCase().includes(searchTerm);
      const contentMatch = (note.content || '').toLowerCase().includes(searchTerm);
      const tagsMatch = (note.tags || []).some(tag => 
        tag.toLowerCase().includes(searchTerm)
      );
      return titleMatch || contentMatch || tagsMatch;
    });

    // Apply additional filters
    if (filters.priority) {
      notes = notes.filter(note => note.priority === filters.priority);
    }

    if (filters.isArchived !== undefined) {
      notes = notes.filter(note => note.isArchived === filters.isArchived);
    }

    if (filters.isPinned !== undefined) {
      notes = notes.filter(note => note.isPinned === filters.isPinned);
    }

    // Tag filtering
    if (filters.tags && Array.isArray(filters.tags) && filters.tags.length > 0) {
      notes = notes.filter(note => {
        const noteTags = note.tags || [];
        return filters.tags.some(filterTag => noteTags.includes(filterTag));
      });
    }

    return notes;
  }

  /**
   * Get a single note by ID
   */
  async getNoteById(id) {
    return await Note.findByPk(id);
  }

  /**
   * Create a new note
   */
  async createNote(noteData) {
    return await Note.create({
      title: noteData.title || "",
      content: noteData.content || "",
      tags: noteData.tags || [],
      isPinned: noteData.isPinned || false,
      isArchived: noteData.isArchived || false,
      isDeleted: false,
      priority: noteData.priority || "medium",
      deadline: noteData.deadline || null,
      news: noteData.news || null,
      financial: noteData.financial || null,
      social: noteData.social || null,
      intelligence: noteData.intelligence || null,
      attachments: noteData.attachments || [],
      drawings: noteData.drawings || []
    });
  }

  /**
   * Update a note
   */
  async updateNote(id, updateData) {
    const note = await Note.findByPk(id);
    if (!note) {
      return null;
    }

    await note.update({
      ...updateData,
      updatedAt: new Date()
    });

    return note;
  }

  /**
   * Delete a note (permanent)
   */
  async deleteNote(id) {
    const note = await Note.findByPk(id);
    if (!note) {
      return false;
    }

    await note.destroy();
    return true;
  }

  /**
   * Get all tags from all notes
   */
  async getAllTags() {
    const notes = await Note.findAll({
      where: { isDeleted: { [Op.ne]: true } },
      attributes: ["tags"]
    });

    const allTags = new Set();
    notes.forEach(note => {
      if (note.tags && Array.isArray(note.tags)) {
        note.tags.forEach(tag => allTags.add(tag));
      }
    });

    return Array.from(allTags);
  }

  /**
   * Get archived notes
   */
  async getArchivedNotes() {
    return await Note.findAll({
      where: {
        isArchived: true,
        isDeleted: { [Op.ne]: true }
      }
    });
  }

  /**
   * Get trashed notes
   */
  async getTrashedNotes() {
    return await Note.findAll({
      where: { isDeleted: true }
    });
  }

  /**
   * Sync database (create tables if they don't exist; add missing columns if alter is true)
   * Use alter: true when the Note model has new columns (e.g. deadline, news, financial, social)
   * that the existing table doesn't have yet.
   */
  async syncDatabase(force = false, alter = true) {
    try {
      await Note.sync({ force, alter });
      await Notification.sync({ force, alter });
      console.log("Database tables synced successfully");
      return true;
    } catch (error) {
      console.error("Error syncing database:", error);
      return false;
    }
  }
}

module.exports = new DatabaseService();

