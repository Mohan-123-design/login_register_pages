import React, { useState } from 'react';
import './TrainerDashboard.css';
import CreateSessionModal from './CreateSessionModal';

function TrainerDashboard() {
  var [sessionsList, setSessionsList] = useState([]);
  var [isModalOpen, setIsModalOpen] = useState(false);
  function openModal() {
    setIsModalOpen(true);
  }
  function closeModal() {
    setIsModalOpen(false);
  }
  function addNewSession(newSession) {
    var updatedList = [];
    for (var i = 0; i < sessionsList.length; i++) {
      updatedList.push(sessionsList[i]);
    }
    updatedList.push(newSession);
    setSessionsList(updatedList);
  }
  function handleNotifyClick(roomId) {
    var updatedList = [];
    for (var i = 0; i < sessionsList.length; i++) {
      if (sessionsList[i].roomId === roomId) {
        var updatedSession = {
          roomId: sessionsList[i].roomId,
          batchName: sessionsList[i].batchName,
          date: sessionsList[i].date,
          time: sessionsList[i].time,
          isNotified: true
        };
        updatedList.push(updatedSession);
      } else {
        updatedList.push(sessionsList[i]);
      }
    }
    setSessionsList(updatedList);
    window.alert('Students have been notified successfully for ' + roomId + '!');
  }

  function handleNotifyAll() {
    var updatedList = [];
    var countNotified = 0;

    for (var i = 0; i < sessionsList.length; i++) {
      if (sessionsList[i].isNotified === false) {
        var updatedSession = {
          roomId: sessionsList[i].roomId,
          batchName: sessionsList[i].batchName,
          date: sessionsList[i].date,
          time: sessionsList[i].time,
          isNotified: true
        };
        updatedList.push(updatedSession);
        countNotified = countNotified + 1;
      } else {
        updatedList.push(sessionsList[i]);
      }
    }

    setSessionsList(updatedList);
    window.alert('All ' + countNotified + ' remaining sessions have been notified!');
  }

  function handleStartSession(roomId) {
    window.sessionStorage.setItem('activeSessionId', roomId);
    window.location.href = '/classroom';
  }

  function formatDate(dateString) {
    var parts = dateString.split('-');
    var year = parts[0];
    var month = parts[1];
    var day = parts[2];
    var monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    var monthIndex = parseInt(month) - 1;
    var monthName = monthNames[monthIndex];

    return day + ' ' + monthName + ' ' + year;
  }

  function formatTime(timeString) {
    var timeParts = timeString.split(':');
    var hours = parseInt(timeParts[0]);
    var minutes = timeParts[1];
    var period = 'AM';

    if (hours >= 12) {
      period = 'PM';
    }
    if (hours > 12) {
      hours = hours - 12;
    }
    if (hours === 0) {
      hours = 12;
    }

    return hours + ':' + minutes + ' ' + period;
  }

  var totalSessions = sessionsList.length;
  var attendedCount = 0;
  var remainingCount = 0;
  for (var j = 0; j < sessionsList.length; j++) {
    if (sessionsList[j].isNotified === true) {
      attendedCount = attendedCount + 1;
    } else {
      remainingCount = remainingCount + 1;
    }
  }
  var sessionCards = [];
  for (var i = 0; i < sessionsList.length; i++) {
    var session = sessionsList[i];
    var notifyButton;
    if (session.isNotified) {
      notifyButton = (
        <button className="notify-btn-done" disabled>
          ✓ Students Notified
        </button>
      );
    } else {
      notifyButton = (function (rid) {
        return (
          <button
            className="notify-btn"
            onClick={function () { handleNotifyClick(rid); }}
          >
            Notify Students
          </button>
        );
      })(session.roomId);
    }
    var startButton = (function (rid) {
      return (
        <button
          className="start-session-btn"
          onClick={function () { handleStartSession(rid); }}
        >
          Start Session
        </button>
      );
    })(session.roomId);

    sessionCards.push(
      <div className="session-card" key={session.roomId}>
        <div className="card-room-id">{session.roomId}</div>
        <div className="card-batch-name">{session.batchName}</div>
        <div className="card-datetime">
          <span className="card-datetime-icon">📅</span>
          {formatDate(session.date)} &nbsp; | &nbsp;
          <span className="card-datetime-icon">🕐</span>
          {formatTime(session.time)}
        </div>
        <div className="card-actions">
          {notifyButton}
          {startButton}
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Trainer Dashboard</h1>
        <button className="create-session-btn" onClick={openModal}>
          <b>+</b> Create Live Session
        </button>
      </div>
      <div className="dashboard-content" style={{ paddingBottom: '90px' }}>
        <h2 className="section-heading">Upcoming Sessions</h2>
        {sessionsList.length === 0 ? (
          <div className="empty-state-box">
            <div className="empty-state-icon">📋</div>
            <p>No sessions scheduled yet.</p>
            <p>Click "+ Create Live Session" to get started.</p>
          </div>
        ) : (
          <div className="sessions-grid">
            {sessionCards}
          </div>
        )}
      </div>
      {sessionsList.length > 0 && (
        <div className="sticky-bottom-bar">
          <div className="stats-item">
            <span className="stats-icon"></span>
            <span className="stats-label">Upcoming</span>
            <span className="stats-value">{totalSessions}</span>
          </div>
          <div className="stats-item">
            <span className="stats-icon"></span>
            <span className="stats-label">Notified</span>
            <span className="stats-value">{attendedCount}</span>
          </div>
          <div className="stats-item">
            <span className="stats-icon"></span>
            <span className="stats-label">Remaining</span>
            <span className="stats-value">{remainingCount}</span>
          </div>
          <div className="stats-item">
            {remainingCount > 0 ? (
              <button className="notify-all-btn" onClick={handleNotifyAll}>
                Notify All ({remainingCount})
              </button>
            ) : (
              <button className="notify-all-btn-done" disabled>
                All Notified
              </button>
            )}
          </div>
        </div>
      )}
      {isModalOpen && (
        <CreateSessionModal
          onClose={closeModal}
          onSessionCreated={addNewSession}
        />
      )}
    </div>
  );
}

export default TrainerDashboard;

