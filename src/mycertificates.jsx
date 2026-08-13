import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./mycertificates.css";

function MyCertificates() {
  var loggedInUser = localStorage.getItem("loggedInUser");
  if (loggedInUser === null) {
    window.location.href = "/access-denied";
    return null;
  }
  var currentUser = JSON.parse(loggedInUser);
  if (currentUser.role !== "Student" && currentUser.role !== "Employee") {
    window.location.href = "/access-denied";
    return null;
  }

  var navigate = useNavigate();
  var [certificates, setCertificates] = useState([]);
  var [isLoading, setIsLoading] = useState(true);
  var [errorMessage, setErrorMessage] = useState("");

  function getToken() {
    return localStorage.getItem("token");
  }

  useEffect(function () {
    fetch("/api/certificates/my", {
      headers: { Authorization: "Bearer " + getToken() },
    })
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
  }, []);

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

  var cards = certificates.map(function (cert) {
    return (
      <div key={cert.certificateId} className="my-cert-card">
        <div className="my-cert-course">{cert.courseName}</div>
        <div className="my-cert-id">Certificate ID: {cert.certificateId}</div>
        <div className="my-cert-dates">
          Completed: {new Date(cert.completionDate).toLocaleDateString()} &nbsp;|&nbsp;
          Issued: {new Date(cert.issueDate).toLocaleDateString()}
        </div>
        <span className={"my-cert-status my-cert-status-" + cert.status.toLowerCase()}>
          {cert.status}
        </span>
        <button
          className="my-cert-download-btn"
          onClick={function () { handleDownload(cert.certificateId); }}
        >
          Download PDF
        </button>
      </div>
    );
  });

  return (
    <div className="my-cert-page">
      <h1>My Certificates</h1>
      <p className="my-cert-subtitle">View and download your earned certificates</p>

      {errorMessage && <div className="my-cert-error">{errorMessage}</div>}
      {isLoading && <p className="my-cert-empty">Loading...</p>}
      {!isLoading && certificates.length === 0 && (
        <p className="my-cert-empty">No certificates yet. Complete a course to earn one!</p>
      )}

      <div className="my-cert-grid">{cards}</div>
    </div>
  );
}

export default MyCertificates;