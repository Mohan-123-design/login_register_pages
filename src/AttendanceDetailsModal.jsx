function AttendanceDetailsModal(props) {
  var record = props.record;
  var onClose = props.onClose;
  if (!record) {
    return null;
  }
  var badgeClass = "att-dash-badge-unknown";
  if (record.status === "Present") {
    badgeClass = "att-dash-badge-present";
  } else if (record.status === "Absent") {
    badgeClass = "att-dash-badge-absent";
  } else if (record.status === "Late") {
    badgeClass = "att-dash-badge-late";
  }
  var joinTimeDisplay = "—";
  if (record.joinTime) {
    var joinDate = new Date(record.joinTime);
    joinTimeDisplay = joinDate.toLocaleString();
  }
  var leaveTimeDisplay = "—";
  if (record.leaveTime) {
    var leaveDate = new Date(record.leaveTime);
    leaveTimeDisplay = leaveDate.toLocaleString();
  }
  var durationDisplay = "—";
  if (record.duration !== undefined && record.duration !== null) {
    durationDisplay = record.duration + " minutes";
  }
  var studentName =
    record.studentName || record.studentEmail || record.userId || "Unknown";
  var sessionName = record.sessionId || "—";
  var dateDisplay = record.date || "—";
  if (!record.date && record.joinTime) {
    var d = new Date(record.joinTime);
    dateDisplay = d.toLocaleDateString();
  }
  function handleBackdropClick() {
    onClose();
  }
  function handleBoxClick(e) {
    e.stopPropagation();
  }
  return (
    <div className="att-dash-modal-overlay" onClick={handleBackdropClick}>
      <div className="att-dash-modal-box" onClick={handleBoxClick}>
        <button className="att-dash-modal-close" onClick={onClose}>
          ✕
        </button>
        <h2 className="att-dash-modal-heading">Attendance Details</h2>
        <div className="att-dash-modal-section">
          <div className="att-dash-modal-section-title">
            Student Information
          </div>
          <div className="att-dash-modal-row">
            <span className="att-dash-modal-label">Name</span>
            <span className="att-dash-modal-value">{studentName}</span>
          </div>
          {record.studentEmail && (
            <div className="att-dash-modal-row">
              <span className="att-dash-modal-label">Email</span>
              <span className="att-dash-modal-value">
                {record.studentEmail}
              </span>
            </div>
          )}
        </div>
        <div className="att-dash-modal-section">
          <div className="att-dash-modal-section-title">
            Session Information
          </div>
          <div className="att-dash-modal-row">
            <span className="att-dash-modal-label">Session</span>
            <span className="att-dash-modal-value">{sessionName}</span>
          </div>
          <div className="att-dash-modal-row">
            <span className="att-dash-modal-label">Date</span>
            <span className="att-dash-modal-value">{dateDisplay}</span>
          </div>
        </div>
        <div className="att-dash-modal-section">
          <div className="att-dash-modal-section-title">Timing Details</div>
          <div className="att-dash-modal-row">
            <span className="att-dash-modal-label">Join Time</span>
            <span className="att-dash-modal-value">{joinTimeDisplay}</span>
          </div>
          <div className="att-dash-modal-row">
            <span className="att-dash-modal-label">Leave Time</span>
            <span className="att-dash-modal-value">{leaveTimeDisplay}</span>
          </div>
          <div className="att-dash-modal-row">
            <span className="att-dash-modal-label">Total Duration</span>
            <span className="att-dash-modal-value">{durationDisplay}</span>
          </div>
        </div>
        <div className="att-dash-modal-section">
          <div className="att-dash-modal-section-title">Status</div>
          <div className="att-dash-modal-row">
            <span className="att-dash-modal-label">Attendance Status</span>
            <span className={badgeClass}>{record.status}</span>
          </div>
          {record.markedBy && (
            <div className="att-dash-modal-row">
              <span className="att-dash-modal-label">Marked By</span>
              <span className="att-dash-modal-value">{record.markedBy}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AttendanceDetailsModal;
