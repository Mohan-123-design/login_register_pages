import react from 'react';
import './ForgotPassword.css';

function ForgotPassword() {

  function handleSendCode(e) {
    e.preventDefault();
    var email = document.getElementById('forgot-email-input').value;
    var emailError = document.getElementById('forgot-email-error');
    var successBox = document.getElementById('forgot-success-message');
    var resetSection = document.getElementById('reset-password-section');
    emailError.style.display = 'none';
    successBox.style.display = 'none';
    var isValid = true;
    if (email.trim() === '') {
      emailError.textContent = 'Email address is required';
      emailError.style.display = 'block';
      isValid = false;
    } else {
      var atPos = email.indexOf('@');
      var dotPos = email.lastIndexOf('.');
      if (atPos < 1 || dotPos < atPos + 2 || dotPos + 2 >= email.length) {
        emailError.textContent = 'Please enter a valid email address';
        emailError.style.display = 'block';
        isValid = false;
      }
    }
    if (isValid) {
      fetch('/api/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email })
      })
        .then(function (response) {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.json();
        })
        .then(function (data) {
          if (data.found) {
            successBox.textContent = 'Verification code has been sent to your email!';
            successBox.style.display = 'block';
            resetSection.style.display = 'block';
          } else {
            emailError.textContent = 'This email is not registered';
            emailError.style.display = 'block';
          }
        })
        .catch(function (error) {
          emailError.textContent = 'Server or network error. Is the backend running?';
          emailError.style.display = 'block';
        });
    }
  }

  function handleResetPassword(e) {
    e.preventDefault();
    var email = document.getElementById('forgot-email-input').value;
    var newPassword = document.getElementById('new-password-input').value;
    var confirmPassword = document.getElementById('confirm-new-password-input').value;
    var newPassError = document.getElementById('new-password-error');
    var confirmPassError = document.getElementById('confirm-new-password-error');
    var resetSuccessBox = document.getElementById('reset-success-message');
    newPassError.style.display = 'none';
    confirmPassError.style.display = 'none';
    resetSuccessBox.style.display = 'none';
    var isValid = true;
    if (newPassword === '') {
      newPassError.textContent = 'New password is required';
      newPassError.style.display = 'block';
      isValid = false;
    } else if (newPassword.length < 8) {
      newPassError.textContent = 'Password must be at least 8 characters';
      newPassError.style.display = 'block';
      isValid = false;
    }
    if (confirmPassword === '') {
      confirmPassError.textContent = 'Please confirm your new password';
      confirmPassError.style.display = 'block';
      isValid = false;
    } else if (newPassword !== confirmPassword) {
      confirmPassError.textContent = 'Passwords do not match';
      confirmPassError.style.display = 'block';
      isValid = false;
    }
    if (isValid) {
      fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, newPassword: newPassword })
      })
        .then(function (response) {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.json();
        })
        .then(function (data) {
          if (data.success) {
            resetSuccessBox.textContent = 'Password updated successfully! Redirecting to login...';
            resetSuccessBox.style.display = 'block';
            setTimeout(function () {
              window.location.href = '/login';
            }, 1500);
          }
        })
        .catch(function (error) {
          newPassError.textContent = 'Server or network error. Is the backend running?';
          newPassError.style.display = 'block';
        });
    }
  }

  return (
    <div className="forgot-page">

      <div className="forgot-left-section">
        <p className="forgot-app-title"><center>AI Education</center></p>
        <h1 className="forgot-main-heading"><center>Empowering Minds with AI Education</center></h1>
        <p className="forgot-description-text"><center>
          AI Education is a emerging technological field that helps to give the knowledge of AI to study and gain skills of new things in current technological world. We have to adapt and obtain these things to our lives to be successful in the future.
        </center></p>
        <ul className="forgot-features-list">
          <li className="forgot-feature-item">
            <span className="forgot-feature-icon">📚</span>
            <span>Smart Learning</span>
          </li>
          <li className="forgot-feature-item">
            <span className="forgot-feature-icon">📝</span>
            <span>Track Progress</span>
          </li>
          <li className="forgot-feature-item">
            <span className="forgot-feature-icon">🌐</span>
            <span>AI Assistance </span>
          </li>
        </ul>
        <div className="illustration-box">
          <img src="src/assets/images.jpeg" alt=" AI illustrutrated image" />
        </div>
      </div>

      <div className="forgot-right-section">
        <div className="forgot-card">
          <h2 className="forgot-welcome-heading">Forgot Password</h2>
          <p className="forgot-subtitle-text">Enter your email to receive a verification code</p>
          <div id="forgot-success-message" className="forgot-success-message" style={{ display: 'none' }}></div>
          <form onSubmit={handleSendCode}>
            <div className="forgot-form-group">
              <label htmlFor="forgot-email-input">Email Address</label>
              <input
                type="email"
                id="forgot-email-input"
                placeholder="Enter your email"
              />
              <p id="forgot-email-error" className="forgot-error-message" style={{ display: 'none' }}></p>
            </div>
            <button type="submit" className="forgot-send-button">Send Code</button>
          </form>
          <div id="reset-password-section" style={{ display: 'none' }}>
            <hr className="forgot-divider" />
            <h3 className="forgot-reset-heading">Reset Password</h3>
            <div id="reset-success-message" className="forgot-success-message" style={{ display: 'none' }}></div>
            <form onSubmit={handleResetPassword}>
              <div className="forgot-form-group">
                <label htmlFor="new-password-input">New Password</label>
                <input
                  type="password"
                  id="new-password-input"
                  placeholder="Enter new password"
                />
                <p id="new-password-error" className="forgot-error-message" style={{ display: 'none' }}></p>
              </div>
              <div className="forgot-form-group">
                <label htmlFor="confirm-new-password-input">Confirm Password</label>
                <input
                  type="password"
                  id="confirm-new-password-input"
                  placeholder="Confirm new password"
                />
                <p id="confirm-new-password-error" className="forgot-error-message" style={{ display: 'none' }}></p>
              </div>
              <button type="submit" className="forgot-send-button">Update Password</button>
            </form>
          </div>
          <p className="forgot-back-text">
            Remember your password? <a href="/login" className="forgot-back-link">Back to Login</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
