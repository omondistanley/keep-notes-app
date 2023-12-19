import React from "react";

const buttonStyle = {
  position: "relative",
  float: "right",
  marginRight: "10px",
  color: "#f5ba13",
  border: "none",
  width: "36px",
  height: "36px",
  cursor: "pointer",
  outline: "none"
};

function Note(props) {
  function handleClick() {
    props.onDelete(props.id);
  }

  return (
    <div className="note">
      <h1>{props.title}</h1>
      <p>{props.content}</p>
      <button onClick={handleClick} style={buttonStyle}>
        DELETE
      </button>
    </div>
  );
}

export default Note;