import React, { useState } from "react";
import "./DigitalClassroom.css";
import Whiteboard from "./Whiteboard";
import ClassroomChat from "./ClassroomChat";

function DigitalClassroom() {
  var [whiteboards, setWhiteboards] = useState(["1"]);
  var leftSectionRef = React.useRef(null);

  function addWhiteboard() {
    var newWhiteboards = [];
    for (var i = 0; i < whiteboards.length; i++) {
      newWhiteboards.push(whiteboards[i]);
    }
    newWhiteboards.push(Date.now().toString());
    setWhiteboards(newWhiteboards);
  }

  React.useEffect(
    function () {
      if (leftSectionRef.current) {
        leftSectionRef.current.scrollTo({
          top: leftSectionRef.current.scrollHeight,
          behavior: "smooth",
        });
      }
    },
    [whiteboards],
  );

  var loggedInUser = localStorage.getItem("loggedInUser");
  if (loggedInUser === null) {
    window.location.href = "/access-denied";
    return null;
  }
  var userData = JSON.parse(loggedInUser);
  if (
    userData.role !== "Student" &&
    userData.role !== "Teacher" &&
    userData.role !== "Admin"
  ) {
    window.location.href = "/access-denied";
    return null;
  }

  return (
    <div className="classroom-page">
      <div className="classroom-left-section" ref={leftSectionRef}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "14px",
          }}
        >
          <h2 className="whiteboard-heading" style={{ marginBottom: 0 }}>
            Whiteboard Development Sandbox
          </h2>
          <button
            onClick={addWhiteboard}
            style={{
              padding: "8px 16px",
              backgroundColor: "#2166c4",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            + New Whiteboard
          </button>
        </div>

        {whiteboards.map(function (id) {
          return (
            <div
              key={id}
              className="whiteboard-wrapper"
              style={{ marginBottom: "20px", minHeight: "600px", flex: "none" }}
            >
              <Whiteboard id={id} />
            </div>
          );
        })}
      </div>
      <div className="classroom-right-section">
        <ClassroomChat />
      </div>
    </div>
  );
}

export default DigitalClassroom;
