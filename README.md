# FullStack-Web-Dev
Created with CodeSandbox

 Technologies Used:
 - MongoDB- database
 - Express
 - Node
 - React

# Link to deployed version.
https://dev-tech-topaz.vercel.app/

 Front-end(essentials)
App.jsx
- The App.jsx file has two very important functions which both implement the fetch function to connect to the bakend database:

1: the addNote function:
    - when the add button is pressed, it sends a post request to the backend server for processing.
    - The function then gets a response from the server, and if the server's response is ok, meaning addition is successful the note is  added both to the ui and the database.



 2. the deleteNote function:
    - the deleteNote function takes the id parameter which specifies exactly which note to be deleted. 
    - when the delete button of a note is pressed, it sends a delete request to the backend server for processing.   
    - The function processes the server's response to the delete function, if successfull, the given note is deleted from the database and UI.


Backend;
- Contains:

server.js
- The file connects to both the front-end and the database.

Front-end connection:
- the server connects to the front-end, implementing the important functions from the App.jsx file:

the post:
    - Receives the post request from the App.jsx file, proccesses then if successful, meaning the note has been added to the database, it sends a response to the app.jsx's addNote function which allows for the note and its contents to be displayed to the user.

the delete:
    - receives the delete parameter from the App.jsx file with the id. 
    - Since the note to be deleted is also delted from the database, we have to check and use the ObjectId function to delete the specified note from the database. 
    - If the deletion is successfull, it sends a response back to the frontend server which then removes the deleted note from the list and UI.

the get:
    - the getnotes function gets all the data/notes in the database, this allows for the display of the database contents, both before addition, after addition, after deletion and before deletion.

