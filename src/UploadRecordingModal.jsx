import { useState } from "react";

function UploadRecordingModal(props) {
  var [selectedSession, setSelectedSession] = useState("");
  var [recordingTitle, setRecordingTitle] = useState("");
  var [videoFileName, setVideoFileName] = useState("");
  var [duration, setDuration] = useState("");
  var [errorMessage, setErrorMessage] = useState("");
  var sessionOptions = [
    "AI Education Batch 1",
    "AI Education Batch 2",
    "AI Education Batch 3",
    "Data Science Batch 1",
    "Data Science Batch 2",
  ];

  function handleSessionChange(e) {
    setSelectedSession(e.target.value);
  }

  function handleTitleChange(e) {
    setRecordingTitle(e.target.value);
  }

  function handleFileChange(e) {
    var fileInput = e.target;
    if (fileInput.files.length > 0) {
      var fileName = fileInput.files[0].name;
      setVideoFileName(fileName);
    } else {
      setVideoFileName("");
    }
  }

  function handleDurationChange(e) {
    setDuration(e.target.value);
  }

  function makeRecordingId(sessionName) {
    var randomNum = Math.floor(Math.random() * 90000) + 10000;
    var firstWord = sessionName.split(" ")[0];
    var recordingId = "REC-" + firstWord + "-" + randomNum;
    return recordingId;
  }

  function handleUploadClick() {
    setErrorMessage("");
    if (selectedSession === "") {
      setErrorMessage("Please select a session.");
      return;
    }
    if (recordingTitle.trim() === "") {
      setErrorMessage("Please enter a recording title.");
      return;
    }
    if (videoFileName === "") {
      setErrorMessage("Please choose a video file to upload.");
      return;
    }
    if (duration.trim() === "") {
      setErrorMessage("Please enter the duration.");
      return;
    }

    var newRecordingId = makeRecordingId(selectedSession);
    var todayDate = new Date();
    var day = todayDate.getDate();
    var month = todayDate.getMonth() + 1;
    var year = todayDate.getFullYear();
    if (day < 10) {
      day = "0" + day;
    }
    if (month < 10) {
      month = "0" + month;
    }
    var dateString = day + "/" + month + "/" + year;
    var hours = todayDate.getHours();
    var minutes = todayDate.getMinutes();
    var period = "AM";
    if (hours >= 12) {
      period = "PM";
    }
    if (hours > 12) {
      hours = hours - 12;
    }
    if (hours === 0) {
      hours = 12;
    }
    if (minutes < 10) {
      minutes = "0" + minutes;
    }
    var timeString = hours + ":" + minutes + " " + period;
    var videoFileInput = document.getElementById("recording-video-input");
    var videoUrl = "";
    if (videoFileInput.files.length > 0) {
      videoUrl = URL.createObjectURL(videoFileInput.files[0]);
    }
    var newRecording = {
      recordingId: newRecordingId,
      session: selectedSession,
      title: recordingTitle,
      videoFile: videoFileName,
      videoUrl: videoUrl,
      duration: duration,
      uploadDate: dateString,
      uploadTime: timeString,
    };
    props.onRecordingUploaded(newRecording);
    setSelectedSession("");
    setRecordingTitle("");
    setVideoFileName("");
    setDuration("");
    setErrorMessage("");
    props.onClose();
  }

  function handleBackdropClick() {
    props.onClose();
  }

  function handleModalBoxClick(e) {
    e.stopPropagation();
  }

  var optionElements = [];
  for (var i = 0; i < sessionOptions.length; i++) {
    optionElements.push(
      <option key={i} value={sessionOptions[i]}>
        {sessionOptions[i]}
      </option>,
    );
  }

  return (
    <div className="modal-overlay" onClick={handleBackdropClick}>
      <div className="modal-box" onClick={handleModalBoxClick}>
        <button className="modal-close-btn" onClick={props.onClose}>
          ✕
        </button>
        <h2 className="modal-heading">Upload Recording</h2>
        {errorMessage !== "" && (
          <div className="modal-error-msg">{errorMessage}</div>
        )}
        <div className="modal-form-group">
          <label htmlFor="recording-session-select">Session</label>
          <select
            id="recording-session-select"
            value={selectedSession}
            onChange={handleSessionChange}
          >
            <option value="">-- Select a session --</option>
            {optionElements}
          </select>
        </div>
        <div className="modal-form-group">
          <label htmlFor="recording-title-input">Recording Title</label>
          <input
            type="text"
            id="recording-title-input"
            placeholder="Enter recording title"
            value={recordingTitle}
            onChange={handleTitleChange}
          />
        </div>
        <div className="modal-form-group">
          <label htmlFor="recording-video-input">Upload Video</label>
          <input
            type="file"
            id="recording-video-input"
            accept="video/*"
            onChange={handleFileChange}
          />
          {videoFileName !== "" && (
            <p className="selected-file-name">Selected: {videoFileName}</p>
          )}
        </div>
        <div className="modal-form-group">
          <label htmlFor="recording-duration-input">
            Duration (e.g. 1h 30m)
          </label>
          <input
            type="text"
            id="recording-duration-input"
            placeholder="Enter duration"
            value={duration}
            onChange={handleDurationChange}
          />
        </div>
        <button className="generate-meeting-btn" onClick={handleUploadClick}>
          Upload Recording
        </button>
      </div>
    </div>
  );
}

export default UploadRecordingModal;
