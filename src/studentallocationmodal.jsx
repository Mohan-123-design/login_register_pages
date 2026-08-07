import { useState, useEffect } from "react";
import "./studentallocationmodal.css";

function StudentAllocationModal({ batchId, onClose, onSaved }) {
  var [availableStudents, setAvailableStudents] = useState([]);
  var [searchInput, setSearchInput] = useState("");
  var [selectedEmails, setSelectedEmails] = useState([]);
  var [isLoading, setIsLoading] = useState(true);
  var [errorMessage, setErrorMessage] = useState("");
  var [isSubmitting, setIsSubmitting] = useState(false);

  function getToken() {
    return localStorage.getItem("token");
  }

  function fetchAvailableStudents(search) {
    setIsLoading(true);
    var url = "/api/admin/batches/" + batchId + "/available-students";
    if (search && search.trim() !== "") {
      url += "?search=" + encodeURIComponent(search.trim());
    }
    fetch(url, {
      headers: { Authorization: "Bearer " + getToken() },
    })
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        if (data.success) {
          setAvailableStudents(data.students);
        } else {
          setErrorMessage(data.message || "Failed to load students.");
        }
      })
      .catch(function (error) {
        console.error("Error fetching available students:", error);
        setErrorMessage("Server or network error. Please try again.");
      })
      .finally(function () {
        setIsLoading(false);
      });
  }

  useEffect(function () {
    fetchAvailableStudents("");
  }, []);

  function handleSearchSubmit(e) {
    e.preventDefault();
    fetchAvailableStudents(searchInput);
  }

  function toggleStudent(email) {
    if (selectedEmails.indexOf(email) === -1) {
      setSelectedEmails(selectedEmails.concat([email]));
    } else {
      setSelectedEmails(selectedEmails.filter((e) => e !== email));
    }
  }

  async function handleAllocate() {
    setErrorMessage("");
    if (selectedEmails.length === 0) {
      setErrorMessage("Select at least one student to allocate.");
      return;
    }

    setIsSubmitting(true);
    try {
      var response = await fetch("/api/admin/batches/" + batchId + "/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + getToken(),
        },
        body: JSON.stringify({ studentEmails: selectedEmails }),
      });
      var data = await response.json();
      if (data.success) {
        onSaved(data.message);
      } else {
        setErrorMessage(data.message || "Failed to allocate students.");
      }
    } catch (error) {
      console.error("Error allocating students:", error);
      setErrorMessage("Server or network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="student-alloc-overlay" onClick={onClose}>
      <div className="student-alloc-box" onClick={(e) => e.stopPropagation()}>
        <div className="student-alloc-header">
          <h2>Allocate Students</h2>
          <button className="student-alloc-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="student-alloc-body">
          {errorMessage !== "" && <div className="student-alloc-error">{errorMessage}</div>}
          <form className="student-alloc-search-form" onSubmit={handleSearchSubmit}>
            <input
              type="text"
              placeholder="Search students by name or email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="student-alloc-search-input"
            />
            <button type="submit" className="student-alloc-btn student-alloc-btn-secondary">
              Search
            </button>
          </form>
          <p className="student-alloc-selected-count">
            {selectedEmails.length} student{selectedEmails.length === 1 ? "" : "s"} selected
          </p>
          {isLoading && <div className="student-alloc-status">Loading students...</div>}
          {!isLoading && availableStudents.length === 0 && (
            <div className="student-alloc-status">No unallocated students found.</div>
          )}
          {!isLoading && availableStudents.length > 0 && (
            <div className="student-alloc-list">
              {availableStudents.map(function (student) {
                var isChecked = selectedEmails.indexOf(student.email) !== -1;
                return (
                  <label key={student._id} className="student-alloc-item">
                    <input type="checkbox" checked={isChecked} onChange={() => toggleStudent(student.email)} />
                    <span className="student-alloc-item-name">
                      {student.firstName + " " + student.lastName}
                    </span>
                    <span className="student-alloc-item-email">{student.email}</span>
                    {student.batch ? (
                      <span className="student-alloc-item-batch">Currently in: {student.batch}</span>
                    ) : null}
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div className="student-alloc-actions">
          <button type="button" className="student-alloc-btn student-alloc-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="student-alloc-btn student-alloc-btn-primary"
            onClick={handleAllocate}
            disabled={isSubmitting || selectedEmails.length === 0}
          >
            {isSubmitting ? "Allocating..." : "Allocate Selected"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default StudentAllocationModal;