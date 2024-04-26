/**
 * A Node.js server that uses Express and MongoDB to create an API for managing notes.
 * Includes endpoints for retrieving all notes, adding a new note, and deleting a note.
 *
 * @module NoteAPI
 */

var Express = require("express");
var MongoClient = require("mongodb").MongoClient;
var cors = require("cors");
const multer = require("multer");
const { default: mongoose } = require("mongoose");
const { ObjectId } = require("mongodb").ObjectId;

var app = Express();
app.use(cors());
app.use(Express.json())

//Schema defining the format of how data is to be added into the database. 
const noteSchema = mongoose.Schema({
  title: String,
  content: String
})

//Connection string to the database from the server.jsx file. 
var mongoString = "mongodb+srv://memes:NwUXUv5P1sKm1xhH@cluster0.sxvjle4.mongodb.net/?retryWrites=true&w=majority";

const keep = new mongoose.model("keep", noteSchema)
var DATABASENAME = "notes";
var dbase;
app.listen(3050, async () => { 
  try {
      const client = await MongoClient.connect(mongoString);
      dbase = client.db(DATABASENAME);
      console.log("MongoDB connection successful");

      
  } catch (error) {
      console.error("Failed to connect to MongoDB", error);
  }
  console.log("Server Started on port 3050\n");
});

/**
 * Retrieves all notes from the database.
 */
async function getNotes() {
  try {
    const result = await dbase.collection("notescollection").find({}).toArray();
    return result;
  } catch (error) {
    console.error("Error finding notes", error);
    throw new Error("Internal Server Error");
  }
}

/**
 * Endpoint for retrieving all notes/ the get request.
 */
 
app.get('/api/notes/GetNotes', async (request, response) => {
  try {
    const notes = await getNotes();
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
    const newNote = request.body;
    const result = await dbase.collection("notescollection").insertOne(newNote);
    if (result.insertedCount === 1) {
      response.status(201).send(result.ops[0]);
    } else {
      //console.error("Failed to add note");
      response.status(500).send({ message: "Internal Server Error" });
    }   
//    response.send(result.ops[0]);
  } catch (error) {
    console.error("Error adding note", error);
    response.status(500).send({ message: "Internal Server Error" });
  }
});

/**
 * Endpoint for deleting a note.
 */
app.delete('/api/notes/DeleteNote/:id', async (request, response) => {
 try {
    const id = new mongoose.Types.ObjectId(request.params.id);
    const result = await dbase.collection("notescollection").deleteOne({ _id: id });
    
    if (result.deletedCount === 1) {
      response.send({ message: "Note deleted successfully" });
    } else {
      response.status(404).send({ message: "Note not found" });
    }
 } catch (error) {
    console.error("Error deleting note", error);
    response.status(500).send({ message: "Internal Server Error" });
 }
});
