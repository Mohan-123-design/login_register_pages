import { useState, useEffect } from "react";
import "./batchformmodal.css";

function BatchFormModal({ mode, batch, onClose, onSaved }) {
  var isEdit = mode === "edit";
  var [name, setName] = useState(isEdit && batch ? batch.name : "");
  var [code, setCode] = useState(isEdit && batch ? batch.code || "" : "");
  var [courseId, setCourseId] = useState(isEdit && batch && batch.courseId ? batch.courseId : "");
  var [trainerEmail, setTrainerEmail] = useState(isEdit && batch ? batch.trainerEmail || "" : "");
  var [schedule, setSchedule] = useState(isEdit && batch ? batch.schedule || "" : "");
  var [capacity, setCapacity] = useState(isEdit && batch ? batch.capacity : 30);
  var [startDate, setStartDate] = useState(
    isEdit && batch && batch.startDate ? batch.startDate.substring(0, 10) : "",
  );
  var [endDate, setEndDate] = useState(
    isEdit && batch && batch.endDate ? batch.endDate.substring(0, 10) : "",
  );
  var [status, setStatus] = useState(isEdit && batch ? batch.status : "Upcoming");
  var [trainers, setTrainers] = useState([]);
  var [courses, setCourses] = useState([]);
  var [errorMessage, setErrorMessage] = useState("");
  var [isSubmitting, setIsSubmitting] = useState(false);

  function getToken() {
    return localStorage.getItem("token");
  }

  useEffect(function () {
    fetch("/api/admin/users?role=Trainer&limit=100", {
      headers: { Authorization: "Bearer " + getToken() },
    })
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        if (data.success) {
          setTrainers(data.users);
        }
      })
      .catch(function (error) {
        console.error("Error fetching trainers:", error);
      });

    fetch("/api/admin/courses?limit=200", {
      headers: { Authorization: "Bearer " + getToken() },
    })
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        if (data.success) {
          setCourses(data.courses);
        }
      })
      .catch(function (error) {
        console.error("Error fetching courses:", error);
      });
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMessage("");

    if (name.trim() === "") {
      setErrorMessage("Batch name is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      var url = isEdit ? "/api/admin/batches/" + batch._id : "/api/admin/batches";
      var method = isEdit ? "PUT" : "POST";
      var payload = {
        name: name.trim(),
        code: code.trim(),
        courseId: courseId || "",
        trainerEmail: trainerEmail,
        schedule: schedule.trim(),
        capacity: capacity,
        startDate: startDate === "" ? null : startDate,
        endDate: endDate === "" ? null : endDate,
        status: status,
      };

      var response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + getToken(),
        },
        body: JSON.stringify(payload),
      });
      var data = await response.json();

      if (data.success) {
        onSaved(isEdit ? "Batch updated successfully." : "Batch created successfully.");
      } else {
        setErrorMessage(data.message || "Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error("Error saving batch:", error);
      setErrorMessage("Server or network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="batch-modal-overlay" onClick={onClose}>
      <div className="batch-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="batch-modal-header">
          <h2>{isEdit ? "Edit Batch" : "Add New Batch"}</h2>
          <button className="batch-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="batch-modal-form">
          {errorMessage !== "" && <div className="batch-modal-error">{errorMessage}</div>}

          <div className="batch-modal-row">
            <div className="batch-modal-field">
              <label>Batch Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Batch 2026-A" />
            </div>
            <div className="batch-modal-field">
              <label>Batch Code</label>
              <input type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. B26A" />
            </div>
          </div>

          <div className="batch-modal-row">
            <div className="batch-modal-field">
              <label>Course</label>
              <select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
                <option value="">No linked course</option>
                {courses.map(function (course) {
                  return (
                    <option key={course._id} value={course._id}>
                      {course.title}
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="batch-modal-field">
              <label>Assign Trainer</label>
              <select value={trainerEmail} onChange={(e) => setTrainerEmail(e.target.value)}>
                <option value="">Unassigned</option>
                {trainers.map(function (trainer) {
                  return (
                    <option key={trainer._id} value={trainer.email}>
                      {trainer.firstName + " " + trainer.lastName}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="batch-modal-row">
            <div className="batch-modal-field">
              <label>Schedule</label>
              <input
                type="text"
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                placeholder="e.g. Mon-Fri, 10:00 AM - 12:00 PM"
              />
            </div>
            <div className="batch-modal-field">
              <label>Capacity</label>
              <input
                type="number"
                min="0"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="e.g. 30"
              />
            </div>
          </div>

          <div className="batch-modal-row">
            <div className="batch-modal-field">
              <label>Start Date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="batch-modal-field">
              <label>End Date</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          <div className="batch-modal-field">
            <label>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="Upcoming">Upcoming</option>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
              <option value="Archived">Archived</option>
            </select>
          </div>

          <div className="batch-modal-actions">
            <button type="button" className="batch-modal-btn batch-modal-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="batch-modal-btn batch-modal-btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : isEdit ? "Save Changes" : "Create Batch"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BatchFormModal;