import { useState, useEffect } from "react";
import "./courseformmodal.css";

function CourseFormModal({ mode, course, onClose, onSaved }) {
  var isEdit = mode === "edit";
  var [title, setTitle] = useState(isEdit ? course.title : "");
  var [code, setCode] = useState(isEdit ? course.code || "" : "");
  var [description, setDescription] = useState(isEdit ? course.description || "" : "");
  var [category, setCategory] = useState(isEdit ? course.category || "" : "");
  var [batch, setBatch] = useState(isEdit ? course.batch || "" : "");
  var [duration, setDuration] = useState(isEdit ? course.duration || "" : "");
  var [startDate, setStartDate] = useState(
    isEdit && course.startDate ? course.startDate.substring(0, 10) : "",
  );
  var [trainerEmail, setTrainerEmail] = useState(isEdit ? course.trainerEmail || "" : "");
  var [trainers, setTrainers] = useState([]);
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
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMessage("");

    if (title.trim() === "") {
      setErrorMessage("Course title is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      var url = isEdit ? "/api/admin/courses/" + course._id : "/api/admin/courses";
      var method = isEdit ? "PUT" : "POST";
      var payload = {
        title: title.trim(),
        code: code.trim(),
        description: description.trim(),
        category: category.trim(),
        batch: batch.trim(),
        duration: duration.trim(),
        startDate: startDate === "" ? null : startDate,
        trainerEmail: trainerEmail,
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
        onSaved(isEdit ? "Course updated successfully." : "Course created successfully.");
      } else {
        setErrorMessage(data.message || "Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error("Error saving course:", error);
      setErrorMessage("Server or network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="course-modal-overlay" onClick={onClose}>
      <div className="course-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="course-modal-header">
          <h2>{isEdit ? "Edit Course" : "Add New Course"}</h2>
          <button className="course-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="course-modal-form">
          {errorMessage !== "" && <div className="course-modal-error">{errorMessage}</div>}

          <div className="course-modal-row">
            <div className="course-modal-field">
              <label>Title</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="course-modal-field">
              <label>Course Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. CS-101"
              />
            </div>
          </div>

          <div className="course-modal-field">
            <label>Description</label>
            <textarea
              rows="3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short course description"
            />
          </div>

          <div className="course-modal-row">
            <div className="course-modal-field">
              <label>Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Web Development"
              />
            </div>
            <div className="course-modal-field">
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

          <div className="course-modal-row">
            <div className="course-modal-field">
              <label>Batch</label>
              <input
                type="text"
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
                placeholder="e.g. B1"
              />
            </div>
            <div className="course-modal-field">
              <label>Duration</label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g. 8 weeks"
              />
            </div>
          </div>

          <div className="course-modal-field">
            <label>Start Date</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>

          <div className="course-modal-actions">
            <button type="button" className="course-modal-btn course-modal-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="course-modal-btn course-modal-btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : isEdit ? "Save Changes" : "Create Course"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CourseFormModal;