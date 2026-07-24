import { useState, useRef } from "react";

function NotificationFilters(props) {
  var filters = props.filters;
  var setFilters = props.setFilters;
  var setPage = props.setPage;
  
  var [localTitle, setLocalTitle] = useState(filters.title);
  var debounceTimeout = useRef(null);

  function handleTitleChange(e) {
    var val = e.target.value;
    setLocalTitle(val);
    
    if (debounceTimeout.current !== null) {
      clearTimeout(debounceTimeout.current);
    }
    
    debounceTimeout.current = setTimeout(function() {
      setFilters(function(prev) {
        var newFilters = Object.assign({}, prev, { title: val });
        return newFilters;
      });
      setPage(1); // Reset page on filter change
    }, 500);
  }

  function handleDropdownChange(field, e) {
    var val = e.target.value;
    setFilters(function(prev) {
      var newFilters = Object.assign({}, prev);
      newFilters[field] = val;
      return newFilters;
    });
    setPage(1);
  }

  return (
    <div className="admin-notif-filters">
      <div className="filter-group">
        <label>Search Title</label>
        <input 
          type="text" 
          placeholder="Search..." 
          value={localTitle} 
          onChange={handleTitleChange} 
        />
      </div>
      <div className="filter-group">
        <label>Priority</label>
        <select value={filters.priority} onChange={function(e) { handleDropdownChange("priority", e); }}>
          <option value="">All</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>
      </div>
      <div className="filter-group">
        <label>Recipient Type</label>
        <select value={filters.recipientType} onChange={function(e) { handleDropdownChange("recipientType", e); }}>
          <option value="">All</option>
          <option value="All">Everyone (&quot;All&quot;)</option>
          <option value="Batch">Batch</option>
          <option value="User">Single User</option>
        </select>
      </div>
      <div className="filter-group">
        <label>Read/Unread</label>
        <select value={filters.isRead} onChange={function(e) { handleDropdownChange("isRead", e); }}>
          <option value="">All</option>
          <option value="false">Unread (0 reads)</option>
          <option value="true">Read (&gt;0 reads)</option>
        </select>
      </div>
      <div className="filter-group">
        <label>From Date</label>
        <input 
          type="date" 
          value={filters.fromDate} 
          onChange={function(e) { handleDropdownChange("fromDate", e); }} 
        />
      </div>
      <div className="filter-group">
        <label>To Date</label>
        <input 
          type="date" 
          value={filters.toDate} 
          onChange={function(e) { handleDropdownChange("toDate", e); }} 
        />
      </div>
    </div>
  );
}

export default NotificationFilters;
