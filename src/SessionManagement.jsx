import { useState, useEffect } from "react";
import "./SessionManagement.css";

function SessionManagement() {
  var [sessions, setSessions] = useState([]);
  async function fetchSessions() {
    try {
      var token = localStorage.getItem("token");
      var response = await fetch("http://localhost:5000/api/sessions", {
        headers: { Authorization: "Bearer " + token },
      });
      var data = await response.json();
      if (data.success) {
        setSessions(data.sessions);
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
    }
  }

  useEffect(() => {
    fetchSessions();
  }, []);
  var [searchTerm, setSearchTerm] = useState("");
  var [statusFilter, setStatusFilter] = useState("All");
  var [dateFilter, setDateFilter] = useState("");
  var [showForm, setShowForm] = useState(false);
  var [editMode, setEditMode] = useState(false);
  var [currentId, setCurrentId] = useState("");
  var [formName, setFormName] = useState("");
  var [formTrainer, setFormTrainer] = useState("");
  var [formDate, setFormDate] = useState("");
  var [formTime, setFormTime] = useState("");
  var [formDuration, setFormDuration] = useState("");
  var [formDescription, setFormDescription] = useState("");
  var [formStatus, setFormStatus] = useState("Upcoming");

  function handleSearch(e) {
    setSearchTerm(e.target.value);
  }

  function handleStatusFilter(e) {
    setStatusFilter(e.target.value);
  }

  function handleDateFilter(e) {
    setDateFilter(e.target.value);
  }

  function openAddForm() {
    setEditMode(false);
    setCurrentId("");
    setFormName("");
    setFormTrainer("");
    setFormDate("");
    setFormTime("");
    setFormDuration("");
    setFormDescription("");
    setFormStatus("Upcoming");
    setShowForm(true);
  }

  function openEditForm(session) {
    setEditMode(true);
    setCurrentId(session.roomId || session.id);
    setFormName(session.name);
    setFormTrainer(session.trainer);
    setFormDate(session.date);
    setFormTime(session.time);
    setFormDuration(session.duration);
    setFormDescription(session.description);
    setFormStatus(session.status);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
  }

  async function saveSession(e) {
    e.preventDefault();
    if (editMode === true) {
      var updatedSessions = [];
      for (var i = 0; i < sessions.length; i++) {
        var idToCheck = sessions[i].id || sessions[i].roomId;
        if (idToCheck === currentId) {
          var updatedSession = {
            roomId: currentId,
            name: formName,
            trainer: formTrainer,
            date: formDate,
            time: formTime,
            duration: formDuration,
            description: formDescription,
            status: formStatus,
          };
          updatedSessions.push(updatedSession);
        } else {
          updatedSessions.push(sessions[i]);
        }
      }
      setSessions(updatedSessions);
      closeForm();
    } else {
      var newId = "S" + Math.floor(Math.random() * 10000);
      var newSession = {
        roomId: newId,
        name: formName,
        trainer: formTrainer,
        date: formDate,
        time: formTime,
        duration: formDuration,
        description: formDescription,
        status: formStatus,
      };

      try {
        var token = localStorage.getItem("token");
        var response = await fetch("http://localhost:5000/api/sessions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
          },
          body: JSON.stringify(newSession),
        });
        var data = await response.json();
        if (data.success) {
          setSessions([...sessions, data.session]);
          closeForm();
        } else {
          alert(data.message || "Failed to create session");
        }
      } catch (error) {
        console.error("Error creating session:", error);
        alert("Failed to create session. Please try again.");
      }
    }
  }

  async function deleteSession(id) {
    var confirmDelete = window.confirm(
      "Are you sure you want to delete this session?",
    );
    if (confirmDelete === true) {
      try {
        var token = localStorage.getItem("token");
        var response = await fetch("http://localhost:5000/api/sessions/" + id, {
          method: "DELETE",
          headers: {
            Authorization: "Bearer " + token,
          },
        });
        var data = await response.json();
        if (data.success) {
          var remainingSessions = [];
          for (var i = 0; i < sessions.length; i++) {
            var idToCheck = sessions[i].id || sessions[i].roomId;
            if (idToCheck !== id) {
              remainingSessions.push(sessions[i]);
            }
          }
          setSessions(remainingSessions);
        } else {
          alert(data.message || "Failed to delete session");
        }
      } catch (error) {
        console.error("Error deleting session:", error);
        alert("Failed to delete session. Please try again.");
      }
    }
  }

  function joinSession(id) {
    window.sessionStorage.setItem("activeSessionId", id);
    window.location.href = "/live-classroom/" + id;
  }
  var filteredSessions = [];
  for (var k = 0; k < sessions.length; k++) {
    var session = sessions[k];
    var matchSearch = true;
    if (searchTerm !== "") {
      var sessionNameLower = session.name.toLowerCase();
      var searchLower = searchTerm.toLowerCase();
      if (sessionNameLower.indexOf(searchLower) === -1) {
        matchSearch = false;
      }
    }
    var matchStatus = true;
    if (statusFilter !== "All") {
      if (session.status !== statusFilter) {
        matchStatus = false;
      }
    }
    var matchDate = true;
    if (dateFilter !== "") {
      if (session.date !== dateFilter) {
        matchDate = false;
      }
    }

    if (matchSearch === true && matchStatus === true && matchDate === true) {
      filteredSessions.push(session);
    }
  }

  var sessionCards = [];
  for (var m = 0; m < filteredSessions.length; m++) {
    var s = filteredSessions[m];
    var editHandler = (function (sess) {
      return function () {
        openEditForm(sess);
      };
    })(s);
    var sessionId = s.roomId || s.id;
    var deleteHandler = (function (id) {
      return function () {
        deleteSession(id);
      };
    })(sessionId);

    var joinHandler = (function (id) {
      return function () {
        joinSession(id);
      };
    })(sessionId);

    sessionCards.push(
      <div className="sm-card" key={sessionId}>
        <div className="sm-card-header">
          <h3>
            {s.name} ({sessionId})
          </h3>
          <span className={"sm-status " + s.status.toLowerCase()}>
            {s.status}
          </span>
        </div>
        <div className="sm-card-body">
          <p>
            <b>Trainer:</b> {s.trainer}
          </p>
          <p>
            <b>Date:</b> {s.date}
          </p>
          <p>
            <b>Time:</b> {s.time}
          </p>
          <p>
            <b>Duration:</b> {s.duration} mins
          </p>
        </div>
        <div className="sm-card-actions">
          <button className="sm-btn-edit" onClick={editHandler}>
            Edit
          </button>
          <button className="sm-btn-delete" onClick={deleteHandler}>
            Delete
          </button>
          <button className="sm-btn-join" onClick={joinHandler}>
            Join Session
          </button>
        </div>
      </div>,
    );
  }

  return (
    <div className="sm-container">
      <div className="sm-header">
        <h1>Session Management</h1>
        <button className="sm-btn-add" onClick={openAddForm}>
          + Add New Session
        </button>
      </div>

      <div className="sm-filters">
        <input
          type="text"
          placeholder="Search by Session Name..."
          value={searchTerm}
          onChange={handleSearch}
          className="sm-input"
        />
        <select
          value={statusFilter}
          onChange={handleStatusFilter}
          className="sm-select"
        >
          <option value="All">All Statuses</option>
          <option value="Upcoming">Upcoming</option>
          <option value="Live">Live</option>
          <option value="Completed">Completed</option>
        </select>
        <input
          type="date"
          value={dateFilter}
          onChange={handleDateFilter}
          className="sm-input"
        />
      </div>

      <div className="sm-list">
        {filteredSessions.length === 0 ? (
          <div className="sm-no-results">No sessions found.</div>
        ) : (
          <div className="sm-grid">{sessionCards}</div>
        )}
      </div>

      {showForm === true && (
        <div className="sm-modal-overlay">
          <div className="sm-modal">
            <h2>{editMode === true ? "Edit Session" : "Add New Session"}</h2>
            <form onSubmit={saveSession}>
              <div className="sm-form-group">
                <label>Session Name</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={function (e) {
                    setFormName(e.target.value);
                  }}
                />
              </div>
              <div className="sm-form-group">
                <label>Trainer Name</label>
                <input
                  type="text"
                  required
                  value={formTrainer}
                  onChange={function (e) {
                    setFormTrainer(e.target.value);
                  }}
                />
              </div>
              <div className="sm-form-group">
                <label>Date</label>
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={function (e) {
                    setFormDate(e.target.value);
                  }}
                />
              </div>
              <div className="sm-form-group">
                <label>Time</label>
                <input
                  type="time"
                  required
                  value={formTime}
                  onChange={function (e) {
                    setFormTime(e.target.value);
                  }}
                />
              </div>
              <div className="sm-form-group">
                <label>Duration (mins)</label>
                <input
                  type="number"
                  required
                  value={formDuration}
                  onChange={function (e) {
                    setFormDuration(e.target.value);
                  }}
                />
              </div>
              <div className="sm-form-group">
                <label>Description</label>
                <textarea
                  rows="3"
                  value={formDescription}
                  onChange={function (e) {
                    setFormDescription(e.target.value);
                  }}
                ></textarea>
              </div>
              <div className="sm-form-group">
                <label>Status</label>
                <select
                  value={formStatus}
                  onChange={function (e) {
                    setFormStatus(e.target.value);
                  }}
                >
                  <option value="Upcoming">Upcoming</option>
                  <option value="Live">Live</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div className="sm-form-actions">
                <button type="submit" className="sm-btn-save">
                  Save
                </button>
                <button
                  type="button"
                  className="sm-btn-cancel"
                  onClick={closeForm}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SessionManagement;
