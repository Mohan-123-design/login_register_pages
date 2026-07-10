import { useState } from "react";
import "./RecordingDashboard.css";
import UploadRecordingModal from "./UploadRecordingModal";

function RecordingDashboard() {
  var [recordingsList, setRecordingsList] = useState([]);
  var [isModalOpen, setIsModalOpen] = useState(false);
  var [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  var [deleteConfirmId, setDeleteConfirmId] = useState(null);
  var loggedInUser = localStorage.getItem("loggedInUser");
  if (loggedInUser === null) {
    window.location.href = "/access-denied";
    return null;
  }

  function openModal() {
    setIsModalOpen(true);
  }
  function closeModal() {
    setIsModalOpen(false);
  }
  function addNewRecording(newRecording) {
    var updatedList = [];
    for (var i = 0; i < recordingsList.length; i++) {
      updatedList.push(recordingsList[i]);
    }
    updatedList.push(newRecording);
    setRecordingsList(updatedList);
  }
  function handlePlayClick(recording) {
    setCurrentlyPlaying(recording);
  }

  function handleClosePlayer() {
    setCurrentlyPlaying(null);
  }

  function handleDownloadClick(recording) {
    if (recording.videoUrl !== "") {
      var tempLink = document.createElement("a");
      tempLink.href = recording.videoUrl;
      tempLink.download = recording.videoFile;
      document.body.appendChild(tempLink);
      tempLink.click();
      document.body.removeChild(tempLink);
    } else {
      window.alert("No video file available to download.");
    }
  }
  function handleDeleteClick(recordingId) {
    setDeleteConfirmId(recordingId);
  }
  function handleCancelDelete() {
    setDeleteConfirmId(null);
  }
  function handleConfirmDelete(recordingId) {
    setRecordingsList(function (previousList) {
      var updatedList = [];
      for (var i = 0; i < previousList.length; i++) {
        if (previousList[i].recordingId !== recordingId) {
          updatedList.push(previousList[i]);
        }
      }
      return updatedList;
    });
    if (currentlyPlaying !== null) {
      if (currentlyPlaying.recordingId === recordingId) {
        setCurrentlyPlaying(null);
      }
    }

    setDeleteConfirmId(null);
  }

  var totalRecordings = recordingsList.length;
  var recordingCards = [];
  for (var i = 0; i < recordingsList.length; i++) {
    var recording = recordingsList[i];
    var cardElement = (function (rec) {
      var isConfirming = deleteConfirmId === rec.recordingId;

      return (
        <div className="recording-card" key={rec.recordingId}>
          <div className="recording-card-left">
            <div className="recording-card-id">{rec.recordingId}</div>
            <div className="recording-card-title">{rec.title}</div>
            <div className="recording-card-session">{rec.session}</div>
            <div className="recording-card-details">
              <span className="recording-card-details-icon">⏱️</span>
              Duration: {rec.duration}
            </div>
            <div className="recording-card-details">
              <span className="recording-card-details-icon">📅</span>
              Uploaded: {rec.uploadDate}
            </div>
            <div className="recording-card-file">
              🎬 <span className="recording-file-name">{rec.videoFile}</span>
            </div>
          </div>
          <div className="recording-card-right">
            {isConfirming === false ? (
              <>
                <button
                  className="recording-play-btn"
                  onClick={function () {
                    handlePlayClick(rec);
                  }}
                >
                  Play
                </button>
                <button
                  className="recording-download-btn"
                  onClick={function () {
                    handleDownloadClick(rec);
                  }}
                >
                  Download
                </button>
                <button
                  className="recording-delete-btn"
                  onClick={function () {
                    handleDeleteClick(rec.recordingId);
                  }}
                >
                  Delete
                </button>
              </>
            ) : (
              <div className="recording-confirm-box">
                <p className="recording-confirm-text">Delete this recording?</p>
                <button
                  className="recording-confirm-yes-btn"
                  onClick={function () {
                    handleConfirmDelete(rec.recordingId);
                  }}
                >
                  ✓ Yes, Delete
                </button>
                <button
                  className="recording-confirm-no-btn"
                  onClick={function () {
                    handleCancelDelete();
                  }}
                >
                  ✕ Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      );
    })(recording);
    recordingCards.push(cardElement);
  }

  return (
    <div className="recording-page">
      <div className="recording-header">
        <h1 className="recording-page-title">
          Recordings Management Dashboard
        </h1>
        <button className="upload-recording-btn" onClick={openModal}>
          + Upload Recording
        </button>
      </div>
      <div className="recording-content" style={{ paddingBottom: "90px" }}>
        {currentlyPlaying !== null && (
          <div className="recording-player-section">
            <div className="recording-player-header">
              <h3 className="recording-player-title">
                Now Playing: {currentlyPlaying.title}
              </h3>
              <button
                className="recording-player-close-btn"
                onClick={handleClosePlayer}
              >
                ✕ Close Player
              </button>
            </div>
            <div className="recording-player-container">
              <video
                className="recording-video-element"
                src={currentlyPlaying.videoUrl}
                controls
                autoPlay
              >
                Your browser does not support the video tag.
              </video>
            </div>
            <div className="recording-player-details">
              <span className="recording-player-detail-item">
                📌 {currentlyPlaying.recordingId}
              </span>
              <span className="recording-player-detail-item">
                📂 {currentlyPlaying.session}
              </span>
              <span className="recording-player-detail-item">
                ⏱️ {currentlyPlaying.duration}
              </span>
            </div>
          </div>
        )}

        <h2 className="recording-section-title">All Recorded Sessions</h2>
        {recordingsList.length === 0 ? (
          <div className="recording-empty-state">
            <div className="recording-empty-icon">🎥</div>
            <p>No recordings uploaded yet.</p>
            <p>Click &quot;+ Upload Recording&quot; to add one.</p>
          </div>
        ) : (
          <div className="recordings-list">{recordingCards}</div>
        )}
      </div>
      {recordingsList.length > 0 && (
        <div className="recording-bottom-bar">
          <div className="recording-stats-item">
            <span className="recording-stats-label">Total Recordings</span>
            <span className="recording-stats-value">{totalRecordings}</span>
          </div>
        </div>
      )}
      {isModalOpen && (
        <UploadRecordingModal
          onClose={closeModal}
          onRecordingUploaded={addNewRecording}
        />
      )}
    </div>
  );
}

export default RecordingDashboard;
