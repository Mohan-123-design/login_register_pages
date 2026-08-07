import { useState, useEffect } from "react";
import "./trainerallocationmodal.css";

function TrainerAllocationModal({ batchId, currentTrainerEmail, onClose, onSaved }) {
  var [trainers, setTrainers] = useState([]);
  var [selectedTrainerEmail, setSelectedTrainerEmail] = useState(currentTrainerEmail || "");
  var [isLoading, setIsLoading] = useState(true);
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
        } else {
          setErrorMessage(data.message || "Failed to load trainers.");
        }
      })
      .catch(function (error) {
        console.error("Error fetching trainers:", error);
        setErrorMessage("Server or network error. Please try again.");
      })
      .finally(function () {
        setIsLoading(false);
      });
  }, []);

  async function handleAssign() {
    setErrorMessage("");
    setIsSubmitting(true);
    try {
      var response = await fetch("/api/admin/batches/" + batchId + "/assign-trainer", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + getToken(),
        },
        body: JSON.stringify({ trainerEmail: selectedTrainerEmail }),
      });
      var data = await response.json();

      if (data.success) {
        onSaved(data.message);
      } else {
        setErrorMessage(data.message || "Failed to assign trainer.");
      }
    } catch (error) {
      console.error("Error assigning trainer:", error);
      setErrorMessage("Server or network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="trainer-alloc-overlay" onClick={onClose}>
      <div className="trainer-alloc-box" onClick={(e) => e.stopPropagation()}>
        <div className="trainer-alloc-header">
          <h2>Assign Trainer</h2>
          <button className="trainer-alloc-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="trainer-alloc-body">
          {errorMessage !== "" && <div className="trainer-alloc-error">{errorMessage}</div>}

          {isLoading && <div className="trainer-alloc-status">Loading trainers...</div>}

          {!isLoading && (
            <div className="trainer-alloc-field">
              <label>Select Trainer</label>
              <select value={selectedTrainerEmail} onChange={(e) => setSelectedTrainerEmail(e.target.value)}>
                <option value="">Unassigned</option>
                {trainers.map(function (trainer) {
                  return (
                    <option key={trainer._id} value={trainer.email}>
                      {trainer.firstName + " " + trainer.lastName + " (" + trainer.email + ")"}
                    </option>
                  );
                })}
              </select>
            </div>
          )}
        </div>

        <div className="trainer-alloc-actions">
          <button type="button" className="trainer-alloc-btn trainer-alloc-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="trainer-alloc-btn trainer-alloc-btn-primary"
            onClick={handleAssign}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default TrainerAllocationModal;