import react from 'react';
import './Login.css';

function Login() {

  function handleLogin(e) {
    e.preventDefault();
    var email = document.getElementById('email-input').value;
    var password = document.getElementById('password-input').value;
    var errorBox = document.getElementById('login-error-message');
    var successBox = document.getElementById('login-success-message');
    errorBox.style.display = 'none';
    successBox.style.display = 'none';
    var isValid = true;
    if (email.trim() === '') {
      errorBox.textContent = 'Please enter your email address';
      errorBox.style.display = 'block';
      isValid = false;
    }
    if (isValid && password === '') {
      errorBox.textContent = 'Please enter your password';
      errorBox.style.display = 'block';
      isValid = false;
    }
    if (isValid) {
      var loginData = {
        email: email,
        password: password
      };
      fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      })
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        if (data.success) {
          successBox.textContent = 'Login successful!';
          successBox.style.display = 'block';
        } else {
          errorBox.textContent = 'Email id or password is incorrect';
          errorBox.style.display = 'block';
        }
      });
    }
  }

  return (
    <div className="login-page">
      <div className="left-section">
        <p className="app-title"><center>AI Education</center></p>
        <h1 className="main-heading"><center>Empowering Minds with AI Education</center></h1>
        <p className="description-text"><center>
          AI Education is a emerging technological field that helps to give the knowledge of AI to study and gain skills of new things in current technological world. We have to adapt and obtain these things to our lives to be successful in the future.
        </center></p>
        <ul className="features-list">
          <li className="feature-item">
            <span className="feature-icon">📚</span>
            <span>Smart Learning</span>
          </li>
          <li className="feature-item">
            <span className="feature-icon">📝</span>
            <span>Track Progress</span>
          </li>
          <li className="feature-item">
            <span className="feature-icon">🌐</span>
            <span>AI Assistance </span>
          </li>
        </ul>
        <div className="illustration-box">
          <img src="src/assets/images.jpeg" alt=" AI illustrutrated image" />
        </div>
      </div>
      <div className="right-section">
        <div className="login-card">
          <h2 className="welcome-heading">Welcome Back</h2>
          <p className="subtitle-text">Please enter your details to sign in</p>
          <div id="login-error-message" className="login-error-box" style={{ display: 'none' }}></div>
          <div id="login-success-message" className="login-success-box" style={{ display: 'none' }}></div>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="email-input">Email Address</label>
              <input
                type="email"
                id="email-input"
                placeholder="Enter your email"
              />
            </div>
            <div className="form-group">
              <label htmlFor="password-input">Password</label>
              <input
                type="password"
                id="password-input"
                placeholder="Enter your password"
              />
            </div>
            <div className="options-row">
              <label className="remember-me">
                <input
                  type="checkbox"
                />
                <span>Remember Me</span>
              </label>
              <a href="/forgot-password" className="forgot-link">Forgot Password?</a>
            </div>
            <button type="submit" className="login-button">Login</button>
          </form>
          <p className="register-text">
            Don't have an account? <a href="/" className="register-link">Register</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;

