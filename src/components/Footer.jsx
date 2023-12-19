import React from "react";

function Footer() {
  const date = new Date();
  const currYear = date.getFullYear();
  return (
    <footer>
      <p>Copyright ⓒ {currYear}</p>
    </footer>
  );
}

export default Footer;
