/**
 * Functional component that manages a list of notes in a React application.
 *
 * @returns {JSX.Element} The rendered React component.
 */
import React, { useState, useEffect } from "react";
import Header from "./Header";
import Footer from "./Footer";
import Note from "./Note";
import CreateArea from "./CreateArea";

function App() {
  const [notes, setNotes] = useState([]);

  /**
   * Fetches the notes from the API when the component mounts.
   */
  useEffect(() => {
    async function fetchNotes() {
      try {
        const response = await fetch("http://localhost:3050/api/notes/GetNotes");

        if (response.ok) {
          const fetchedNotes = await response.json();
          setNotes(fetchedNotes);
        } else {
          console.error("Failed to fetch notes");
        }
      } catch (error) {
        console.error("Error fetching notes", error);
      }
    }

    fetchNotes();
  }, []);

  /**
   * Stores the `notes` state in the local storage whenever it changes.
   */
  useEffect(() => {
    localStorage.setItem("notes", JSON.stringify(notes));
  }, [notes]);

  /**
   * Adds a new note to the `notes` state and the API.
   *
   * @param {Object} newNote - The new note to be added.
   */
  async function addNote(newNote) {
    setNotes((prevNotes) => [...prevNotes, newNote]);
    try {
      const response = await fetch("http://localhost:3050/api/notes/AddNote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newNote),
      });

      if (response.ok) {
        const addedNote = await response.json();
        setNotes((prevNotes) => [...prevNotes, addedNote]);
      } else {
        console.error("Failed to add note");
      }
    } catch (error) {
      console.error("Error adding note", error);
    }
  }

  /**
   * Deletes a note from the `notes` state and the API.
   *
   * @param {string} id - The id of the note to be deleted.
   */
  async function deleteNote(id) {
    try {
      const response = await fetch(`http://localhost:3050/api/notes/DeleteNote/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        response.json().then((addedNote) => {
          setNotes((prevNotes) => prevNotes.filter((noteItem) => noteItem._id !== id));
        });
      } else {
        console.error("Failed to delete note");
      }
    } catch (error) {
      console.error("Error deleting note", error);
    }
  }

  return (
    <div>
      <Header />
      <CreateArea onAdd={addNote} />
      {notes.map((noteItem) => (
        <Note
          key={noteItem._id}
          id={noteItem._id}
          title={noteItem.title}
          content={noteItem.content}
          onDelete={() => deleteNote(noteItem._id)}
        />
      ))}
      <Footer />
    </div>
  );
}

export default App;
