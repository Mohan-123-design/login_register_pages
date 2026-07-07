import { useState } from 'react';

function CreateSessionModal(props) {
  var [selectedBatch, setSelectedBatch] = useState('');
  var [selectedDate, setSelectedDate] = useState('');
  var [selectedTime, setSelectedTime] = useState('');
  var [errorMessage, setErrorMessage] = useState('');
  var batchList = [
    'AI Education Batch 1',
    'AI Education Batch 2',
    'AI Education Batch 3',
    'Data Science Batch 1',
    'Data Science Batch 2'
  ];
  function handleBatchChange(e) {
    setSelectedBatch(e.target.value);
  }
  function handleDateChange(e) {
    setSelectedDate(e.target.value);
  }
  function handleTimeChange(e) {
    setSelectedTime(e.target.value);
  }
  function makeRoomId(batchName) {
    var randomNum = Math.floor(Math.random() * 90000) + 10000;
    var firstWord = batchName.split(' ')[0];
    var roomId = 'ROOM-' + firstWord + '-' + randomNum;
    return roomId;
  }
  function handleGenerateMeeting() {
    setErrorMessage('');
    if (selectedBatch === '') {
      setErrorMessage('Please select a batch first.');
      return;
    }
    if (selectedDate === '') {
      setErrorMessage('Please pick a date for the session.');
      return;
    }
    if (selectedTime === '') {
      setErrorMessage('Please pick a time for the session.');
      return;
    }

    var newRoomId = makeRoomId(selectedBatch);
    var newSession = {
      roomId: newRoomId,
      batchName: selectedBatch,
      date: selectedDate,
      time: selectedTime,
      isNotified: false
    };
    props.onSessionCreated(newSession);
    setSelectedBatch('');
    setSelectedDate('');
    setSelectedTime('');
    setErrorMessage('');
    props.onClose();
  }
  function handleBackdropClick() {
    props.onClose();
  }
  function handleModalBoxClick(e) {
    e.stopPropagation();
  }
  var batchOptions = [];
  for (var i = 0; i < batchList.length; i++) {
    batchOptions.push(
      <option key={i} value={batchList[i]}>
        {batchList[i]}
      </option>
    );
  }

  return (
    <div className="modal-overlay" onClick={handleBackdropClick}>
      <div className="modal-box" onClick={handleModalBoxClick}>
        <button className="modal-close-btn" onClick={props.onClose}>
          ✕
        </button>
        <h2 className="modal-heading">Create Live Session</h2>
        {errorMessage !== '' && (
          <div className="modal-error-msg">{errorMessage}</div>
        )}
        <div className="modal-form-group">
          <label htmlFor="batch-select">Select Batch</label>
          <select
            id="batch-select"
            value={selectedBatch}
            onChange={handleBatchChange}
          >
            <option value="">-- Choose a batch --</option>
            {batchOptions}
          </select>
        </div>
        <div className="modal-form-group">
          <label htmlFor="date-picker">Session Date</label>
          <input
            type="date"
            id="date-picker"
            value={selectedDate}
            onChange={handleDateChange}
          />
        </div>
        <div className="modal-form-group">
          <label htmlFor="time-picker">Session Time</label>
          <input
            type="time"
            id="time-picker"
            value={selectedTime}
            onChange={handleTimeChange}
          />
        </div>
        <button
          className="generate-meeting-btn"
          onClick={handleGenerateMeeting}
        >
          Generate Meeting
        </button>
      </div>
    </div>
  );
}

export default CreateSessionModal;
