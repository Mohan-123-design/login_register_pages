import { useState } from "react";
import "./RecordingDashboard.css";
import UploadRecordingModal from "./UploadRecordingModal";

function RecordingDashboard() {
  var [recordingsList, setRecordingsList] = useState([]);
  var [isModalOpen, setIsModalOpen] = useState(false);

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

  var totalRecordings = recordingsList.length;

  var recordingCards = [];
  for (var i = 0; i < recordingsList.length; i++) {
    var recording = recordingsList[i];
    recordingCards.push(
      <div className="recording-card" key={recording.recordingId}>
        <div className="recording-card-id">{recording.recordingId}</div>
        <div className="recording-card-title">{recording.title}</div>
        <div className="recording-card-session">{recording.session}</div>
        <div className="recording-card-details">
          <span className="recording-card-details-icon">⏱️</span>
          Duration: {recording.duration}
        </div>
        <div className="recording-card-details">
          <span className="recording-card-details-icon">📅</span>
          Uploaded: {recording.uploadDate}
        </div>
        <div className="recording-card-file">🎬 {recording.videoFile}</div>
      </div>,
    );
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
        <h2 className="recording-section-title">All Recorded Sessions</h2>
        {recordingsList.length === 0 ? (
          <div className="recording-empty-state">
            <div className="recording-empty-icon">🎥</div>
            <p>No recordings uploaded yet.</p>
            <p>Click &quot;+ Upload Recording&quot; to add one.</p>
          </div>
        ) : (
          <div className="recordings-grid">{recordingCards}</div>
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
