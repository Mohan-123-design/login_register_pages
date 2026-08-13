import { useState } from "react";
import "./certificateverify.css";

function CertificateVerify() {
  var [code, setCode] = useState("");
  var [result, setResult] = useState(null);
  var [isLoading, setIsLoading] = useState(false);
  var [errorMessage, setErrorMessage] = useState("");

  function handleVerify(e) {
    e.preventDefault();
    if (!code.trim()) {
      setErrorMessage("Please enter a certificate ID");
      return;
    }
    setErrorMessage("");
    setResult(null);
    setIsLoading(true);

    fetch("/api/certificates/verify/" + encodeURIComponent(code.trim()))
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        setIsLoading(false);
        if (data.success) {
          setResult(data);
        } else {
          setErrorMessage(data.message || "Verification failed");
        }
      })
      .catch(function () {
        setIsLoading(false);
        setErrorMessage("Something went wrong while verifying the certificate");
      });
  }

  return (
    <div className="cert-verify-page">
      <div className="cert-verify-box">
        <h1>Verify a Certificate</h1>
        <p className="cert-verify-subtitle">
          Enter the Certificate ID found on the certificate
        </p>

        <form onSubmit={handleVerify} className="cert-verify-form">
          <input
            type="text"
            placeholder="e.g. CERT-2026-AB12CD"
            value={code}
            onChange={function (e) { setCode(e.target.value); }}
          />
          <button type="submit" disabled={isLoading}>
            {isLoading ? "Verifying..." : "Verify"}
          </button>
        </form>

        {errorMessage && <div className="cert-verify-error">{errorMessage}</div>}

        {result && (
          <div className={"cert-verify-result " + (result.valid ? "cert-verify-valid" : "cert-verify-invalid")}>
            <div className="cert-verify-result-title">
              {result.valid ? "✔ Certificate is Valid" : "✖ " + result.message}
            </div>
            {result.certificate && (
              <div className="cert-verify-details">
                <div><strong>Student:</strong> {result.certificate.studentName}</div>
                <div><strong>Course:</strong> {result.certificate.courseName}</div>
                <div><strong>Certificate ID:</strong> {result.certificate.certificateId}</div>
                <div><strong>Completion Date:</strong> {new Date(result.certificate.completionDate).toLocaleDateString()}</div>
                <div><strong>Issue Date:</strong> {new Date(result.certificate.issueDate).toLocaleDateString()}</div>
                <div><strong>Status:</strong> {result.certificate.status}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default CertificateVerify;