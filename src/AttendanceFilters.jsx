function AttendanceFilters(props) {
  var searchText = props.searchText;
  var onSearchChange = props.onSearchChange;
  var sessionFilter = props.sessionFilter;
  var onSessionFilterChange = props.onSessionFilterChange;
  var statusFilter = props.statusFilter;
  var onStatusFilterChange = props.onStatusFilterChange;
  var dateFilter = props.dateFilter;
  var onDateFilterChange = props.onDateFilterChange;
  var sessionOptions = props.sessionOptions;
  var sessionOptionElements = [];
  for (var i = 0; i < sessionOptions.length; i++) {
    sessionOptionElements.push(
      <option key={i} value={sessionOptions[i]}>
        {sessionOptions[i]}
      </option>,
    );
  }

  return (
    <div className="att-dash-filters">
      <div className="att-dash-filter-group">
        <label className="att-dash-filter-label">Search by Name</label>
        <input
          type="text"
          className="att-dash-filter-input"
          placeholder="Type a student name..."
          value={searchText}
          onChange={function (e) {
            onSearchChange(e.target.value);
          }}
        />
      </div>
      <div className="att-dash-filter-group">
        <label className="att-dash-filter-label">Session</label>
        <select
          className="att-dash-filter-select"
          value={sessionFilter}
          onChange={function (e) {
            onSessionFilterChange(e.target.value);
          }}
        >
          <option value="All">All Sessions</option>
          {sessionOptionElements}
        </select>
      </div>
      <div className="att-dash-filter-group">
        <label className="att-dash-filter-label">Status</label>
        <select
          className="att-dash-filter-select"
          value={statusFilter}
          onChange={function (e) {
            onStatusFilterChange(e.target.value);
          }}
        >
          <option value="All">All Statuses</option>
          <option value="Present">Present</option>
          <option value="Absent">Absent</option>
          <option value="Late">Late</option>
        </select>
      </div>
      <div className="att-dash-filter-group">
        <label className="att-dash-filter-label">Date</label>
        <input
          type="date"
          className="att-dash-filter-input"
          value={dateFilter}
          onChange={function (e) {
            onDateFilterChange(e.target.value);
          }}
        />
      </div>
    </div>
  );
}

export default AttendanceFilters;
