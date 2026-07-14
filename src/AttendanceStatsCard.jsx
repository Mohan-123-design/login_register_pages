function AttendanceStatsCard(props) {
  var totalStudents = props.totalStudents;
  var presentCount = props.presentCount;
  var absentCount = props.absentCount;
  var attendancePercentage = props.attendancePercentage;

  return (
    <div className="att-dash-stats-row">
      <div className="att-dash-stat-card">
        <div className="att-dash-stat-icon">👥</div>
        <div className="att-dash-stat-label">Total Students</div>
        <div className="att-dash-stat-number stat-total">{totalStudents}</div>
      </div>
      <div className="att-dash-stat-card">
        <div className="att-dash-stat-icon">✅</div>
        <div className="att-dash-stat-label">Present</div>
        <div className="att-dash-stat-number stat-present">{presentCount}</div>
      </div>
      <div className="att-dash-stat-card">
        <div className="att-dash-stat-icon">❌</div>
        <div className="att-dash-stat-label">Absent</div>
        <div className="att-dash-stat-number stat-absent">{absentCount}</div>
      </div>
      <div className="att-dash-stat-card">
        <div className="att-dash-stat-icon">📊</div>
        <div className="att-dash-stat-label">Attendance %</div>
        <div className="att-dash-stat-number stat-percentage">
          {attendancePercentage}%
        </div>
      </div>
    </div>
  );
}

export default AttendanceStatsCard;
