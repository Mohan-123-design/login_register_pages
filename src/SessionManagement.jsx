import { useState } from "react";
import "./SessionManagement.css";

function SessionManagement() {
  var [sessions, setSessions] = useState([]);
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
    setCurrentId(session.id);
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

  function saveSession(e) {
    e.preventDefault();
    if (editMode === true) {
      var updatedSessions = [];
      for (var i = 0; i < sessions.length; i++) {
        if (sessions[i].id === currentId) {
          var updatedSession = {
            id: currentId,
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
    } else {
      var newId = "S" + Math.floor(Math.random() * 10000);
      var newSession = {
        id: newId,
        name: formName,
        trainer: formTrainer,
        date: formDate,
        time: formTime,
        duration: formDuration,
        description: formDescription,
        status: formStatus,
      };

      var allSessions = [];
      for (var j = 0; j < sessions.length; j++) {
        allSessions.push(sessions[j]);
      }
      allSessions.push(newSession);
      setSessions(allSessions);
    }
    closeForm();
  }

  function deleteSession(id) {
    var confirmDelete = window.confirm(
      "Are you sure you want to delete this session?",
    );
    if (confirmDelete === true) {
      var remainingSessions = [];
      for (var i = 0; i < sessions.length; i++) {
        if (sessions[i].id !== id) {
          remainingSessions.push(sessions[i]);
        }
      }
      setSessions(remainingSessions);
    }
  }

  function joinSession(id) {
    window.alert("Joining session: " + id);
    window.location.href = "/classroom";
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

    var deleteHandler = (function (id) {
      return function () {
        deleteSession(id);
      };
    })(s.id);

    var joinHandler = (function (id) {
      return function () {
        joinSession(id);
      };
    })(s.id);

    sessionCards.push(
      <div className="sm-card" key={s.id}>
        <div className="sm-card-header">
          <h3>
            {s.name} ({s.id})
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
