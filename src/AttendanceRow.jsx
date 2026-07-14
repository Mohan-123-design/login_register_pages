function AttendanceRow(props) {
  var record = props.record;
  var onViewDetails = props.onViewDetails;
  var badgeClass = "att-dash-badge-unknown";
  if (record.status === "Present") {
    badgeClass = "att-dash-badge-present";
  } else if (record.status === "Absent") {
    badgeClass = "att-dash-badge-absent";
  } else if (record.status === "Late") {
    badgeClass = "att-dash-badge-late";
  }
  var joinTimeDisplay = "";
  if (record.joinTime) {
    var joinDate = new Date(record.joinTime);
    joinTimeDisplay = joinDate.toLocaleString();
  }
  var leaveTimeDisplay;
  if (record.leaveTime) {
    var leaveDate = new Date(record.leaveTime);
    leaveTimeDisplay = leaveDate.toLocaleString();
  } else {
    leaveTimeDisplay = "—";
  }
  var durationDisplay;
  if (record.duration !== undefined && record.duration !== null) {
    durationDisplay = record.duration + " min";
  } else {
    durationDisplay = "—";
  }
  var studentName =
    record.studentName || record.studentEmail || record.userId || "Unknown";
  var sessionName = record.sessionId || record.date || "—";
  return (
    <tr className="att-dash-row">
      <td className="att-dash-td">{studentName}</td>
      <td className="att-dash-td">{sessionName}</td>
      <td className="att-dash-td">{joinTimeDisplay || "—"}</td>
      <td className="att-dash-td">{leaveTimeDisplay}</td>
      <td className="att-dash-td">{durationDisplay}</td>
      <td className="att-dash-td">
        <span className={badgeClass}>{record.status}</span>
      </td>
      <td className="att-dash-td">
        <button
          className="att-dash-view-btn"
          onClick={function () {
            onViewDetails(record);
          }}
        >
          View Details
        </button>
      </td>
    </tr>
  );
}

export default AttendanceRow;
