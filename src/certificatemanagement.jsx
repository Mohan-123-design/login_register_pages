import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./certificatemanagement.css";

function CertificateManagement() {
  var loggedInUser = localStorage.getItem("loggedInUser");
  if (loggedInUser === null) {
    window.location.href = "/access-denied";
    return null;
  }
  var currentUser = JSON.parse(loggedInUser);
  if (currentUser.role !== "Admin" && currentUser.role !== "Trainer") {
    window.location.href = "/access-denied";
    return null;
  }

  var navigate = useNavigate();
  var [certificates, setCertificates] = useState([]);
  var [isLoading, setIsLoading] = useState(true);
  var [errorMessage, setErrorMessage] = useState("");
  var [actionMessage, setActionMessage] = useState("");
  var [search, setSearch] = useState("");
  var [isFormOpen, setIsFormOpen] = useState(false);

  var [studentName, setStudentName] = useState("");
  var [studentEmail, setStudentEmail] = useState("");
  var [courseName, setCourseName] = useState("");
  var [batch, setBatch] = useState("");
  var [completionDate, setCompletionDate] = useState("");
  var [formError, setFormError] = useState("");
  var [isSubmitting, setIsSubmitting] = useState(false);

  function getToken() {
    return localStorage.getItem("token");
  }

  function fetchCertificates() {
    setIsLoading(true);
    setErrorMessage("");
    var url = "/api/certificates";
    if (search) {
      url += "?search=" + encodeURIComponent(search);
    }
    fetch(url, { headers: { Authorization: "Bearer " + getToken() } })
      .then(function (response) {
        if (response.status === 401 || response.status === 403) {
          navigate("/access-denied");
          return null;
        }
        return response.json();
      })
      .then(function (data) {
        if (data === null) return;
        if (data.success) {
          setCertificates(data.certificates);
        } else {
          setErrorMessage(data.message || "Failed to load certificates");
        }
        setIsLoading(false);
      })
      .catch(function () {
        setErrorMessage("Something went wrong while loading certificates");
        setIsLoading(false);
      });
  }

  useEffect(function () {
    fetchCertificates();
  }, [search]);

  function handleGenerate(e) {
    e.preventDefault();
    setFormError("");
    if (!studentName || !studentEmail || !courseName || !completionDate) {
      setFormError("Please fill in all required fields");
      return;
    }
    setIsSubmitting(true);
    fetch("/api/certificates", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + getToken(),
      },
      body: JSON.stringify({
        studentName: studentName,
        studentEmail: studentEmail,
        courseName: courseName,
        batch: batch,
        completionDate: completionDate,
      }),
    })
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        setIsSubmitting(false);
        if (data.success) {
          setActionMessage("Certificate generated: " + data.certificate.certificateId);
          setIsFormOpen(false);
          setStudentName("");
          setStudentEmail("");
          setCourseName("");
          setBatch("");
          setCompletionDate("");
          fetchCertificates();
          setTimeout(function () {
            setActionMessage("");
          }, 4000);
        } else {
          setFormError(data.message || "Failed to generate certificate");
        }
      })
      .catch(function () {
        setIsSubmitting(false);
        setFormError("Something went wrong while generating the certificate");
      });
  }

  function handleDownload(certificateId) {
    fetch("/api/certificates/" + certificateId + "/download", {
      headers: { Authorization: "Bearer " + getToken() },
    })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Download failed");
        }
        return response.blob();
      })
      .then(function (blob) {
        var url = window.URL.createObjectURL(blob);
        var link = document.createElement("a");
        link.href = url;
        link.download = certificateId + ".pdf";
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      })
      .catch(function () {
        setErrorMessage("Failed to download certificate PDF");
      });
  }

  function handleRevokeToggle(cert) {
    var newStatus = cert.status === "Valid" ? "Revoked" : "Valid";
    fetch("/api/certificates/" + cert.certificateId + "/status", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + getToken(),
      },
      body: JSON.stringify({ status: newStatus }),
    })
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        if (data.success) {
          fetchCertificates();
        } else {
          setErrorMessage(data.message || "Failed to update status");
        }
      });
  }

  var rows = certificates.map(function (cert) {
    return (
      <tr key={cert.certificateId} className="cert-mgmt-row">
        <td>{cert.studentName}</td>
        <td>{cert.courseName}</td>
        <td>{cert.certificateId}</td>
        <td>{new Date(cert.completionDate).toLocaleDateString()}</td>
        <td>{new Date(cert.issueDate).toLocaleDateString()}</td>
        <td>
          <span className={"cert-status-badge cert-status-" + cert.status.toLowerCase()}>
            {cert.status}
          </span>
        </td>
        <td className="cert-mgmt-actions">
          <button className="cert-btn cert-btn-download" onClick={function () { handleDownload(cert.certificateId); }}>
            Download
          </button>
          {currentUser.role === "Admin" && (
            <button className="cert-btn cert-btn-toggle" onClick={function () { handleRevokeToggle(cert); }}>
              {cert.status === "Valid" ? "Revoke" : "Restore"}
            </button>
          )}
        </td>
      </tr>
    );
  });

  return (
    <div className="cert-mgmt-page">
      <div className="cert-mgmt-header">
        <div>
          <h1>Certificate Management</h1>
          <p className="cert-mgmt-subtitle">Generate, view and manage student certificates</p>
        </div>
        {currentUser.role === "Admin" && (
          <button className="cert-btn cert-btn-primary" onClick={function () { setIsFormOpen(true); }}>
            + Generate Certificate
          </button>
        )}
      </div>

      {actionMessage && <div className="cert-mgmt-success">{actionMessage}</div>}
      {errorMessage && <div className="cert-mgmt-error">{errorMessage}</div>}

      <input
        className="cert-mgmt-search"
        type="text"
        placeholder="Search by student, course or certificate ID..."
        value={search}
        onChange={function (e) { setSearch(e.target.value); }}
      />

      <div className="cert-mgmt-table-wrapper">
        <table className="cert-mgmt-table">
          <thead>
            <tr>
              <th>Student Name</th>
              <th>Course Name</th>
              <th>Certificate ID</th>
              <th>Completion Date</th>
              <th>Issue Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>{rows}</tbody>
        </table>
        {isLoading && <p className="cert-mgmt-empty">Loading certificates...</p>}
        {!isLoading && certificates.length === 0 && (
          <p className="cert-mgmt-empty">No certificates found.</p>
        )}
      </div>

      {isFormOpen && (
        <div className="cert-modal-overlay" onClick={function () { setIsFormOpen(false); }}>
          <div className="cert-modal" onClick={function (e) { e.stopPropagation(); }}>
            <h2>Generate Certificate</h2>
            {formError && <div className="cert-mgmt-error">{formError}</div>}
            <form onSubmit={handleGenerate}>
              <label>Student Name *</label>
              <input value={studentName} onChange={function (e) { setStudentName(e.target.value); }} />

              <label>Student Email *</label>
              <input type="email" value={studentEmail} onChange={function (e) { setStudentEmail(e.target.value); }} />

              <label>Course Name *</label>
              <input value={courseName} onChange={function (e) { setCourseName(e.target.value); }} />

              <label>Batch</label>
              <input value={batch} onChange={function (e) { setBatch(e.target.value); }} />

              <label>Completion Date *</label>
              <input type="date" value={completionDate} onChange={function (e) { setCompletionDate(e.target.value); }} />

              <div className="cert-modal-actions">
                <button type="button" className="cert-btn" onClick={function () { setIsFormOpen(false); }}>
                  Cancel
                </button>
                <button type="submit" className="cert-btn cert-btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? "Generating..." : "Generate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CertificateManagement;