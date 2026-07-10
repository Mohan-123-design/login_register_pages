import "./AccessDenied.css";
function AccessDenied() {
  var loggedInUser = localStorage.getItem("loggedInUser");
  var userRole = "Unknown";
  if (loggedInUser !== null) {
    var userData = JSON.parse(loggedInUser);
    userRole = userData.role;
  }

  return (
    <div className="access-denied-page">
      <div className="access-denied-card">
        <div className="access-denied-icon">🚫</div>
        <h1 className="access-denied-heading">Access Denied</h1>
        <p className="access-denied-text">
          You do not have permission to view this page.
        </p>
        <p className="access-denied-role">
          Your current role: <strong>{userRole}</strong>
        </p>
        <a href="/login" className="access-denied-login-btn">
          Back to Login
        </a>
        <a href="/dashboard" className="access-denied-dashboard-link">
          Go to Dashboard
        </a>
      </div>
    </div>
  );
}

export default AccessDenied;
