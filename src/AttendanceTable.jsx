import AttendanceRow from "./AttendanceRow";
function AttendanceTable(props) {
  var records = props.records;
  var onViewDetails = props.onViewDetails;
  var tableRows = [];
  for (var i = 0; i < records.length; i++) {
    tableRows.push(
      <AttendanceRow
        key={i}
        record={records[i]}
        onViewDetails={onViewDetails}
      />,
    );
  }

  return (
    <div className="att-dash-table-wrapper">
      <table className="att-dash-table">
        <thead>
          <tr>
            <th className="att-dash-th">Student Name</th>
            <th className="att-dash-th">Session Name</th>
            <th className="att-dash-th">Join Time</th>
            <th className="att-dash-th">Leave Time</th>
            <th className="att-dash-th">Duration</th>
            <th className="att-dash-th">Attendance Status</th>
            <th className="att-dash-th">Actions</th>
          </tr>
        </thead>
        <tbody>{tableRows}</tbody>
      </table>
    </div>
  );
}

export default AttendanceTable;
