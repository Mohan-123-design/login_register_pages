import "./Register.css";

function Register() {
  function handleRegister(e) {
    e.preventDefault();
    var firstName = document.getElementById("first-name-input").value;
    var lastName = document.getElementById("last-name-input").value;
    var email = document.getElementById("register-email-input").value;
    var password = document.getElementById("register-password-input").value;
    var confirmPassword = document.getElementById(
      "confirm-password-input",
    ).value;
    var role = document.getElementById("role-select").value;
    var firstNameError = document.getElementById("first-name-error");
    var lastNameError = document.getElementById("last-name-error");
    var emailError = document.getElementById("email-error");
    var passwordError = document.getElementById("password-error");
    var confirmError = document.getElementById("confirm-password-error");
    var successBox = document.getElementById("success-message");
    firstNameError.style.display = "none";
    lastNameError.style.display = "none";
    emailError.style.display = "none";
    passwordError.style.display = "none";
    confirmError.style.display = "none";
    successBox.style.display = "none";

    var isValid = true;
    if (firstName.trim() === "") {
      firstNameError.textContent = "First name is required";
      firstNameError.style.display = "block";
      isValid = false;
    }
    if (lastName.trim() === "") {
      lastNameError.textContent = "Last name is required";
      lastNameError.style.display = "block";
      isValid = false;
    }
    if (email.trim() === "") {
      emailError.textContent = "Email is required";
      emailError.style.display = "block";
      isValid = false;
    } else {
      var atPos = email.indexOf("@");
      var dotPos = email.lastIndexOf(".");
      if (atPos < 1 || dotPos < atPos + 2 || dotPos + 2 >= email.length) {
        emailError.textContent = "Please enter a valid email address";
        emailError.style.display = "block";
        isValid = false;
      }
    }
    if (password === "") {
      passwordError.textContent = "Password is required";
      passwordError.style.display = "block";
      isValid = false;
    } else {
      var passwordProblem = "";
      if (password.length < 8) {
        passwordProblem = "Must be at least 8 characters";
      }
      if (passwordProblem === "") {
        var hasUpper = false;
        for (var i = 0; i < password.length; i++) {
          if (password[i] >= "A" && password[i] <= "Z") {
            hasUpper = true;
          }
        }
        if (!hasUpper) {
          passwordProblem = "Must contain at least one uppercase letter";
        }
      }
      if (passwordProblem === "") {
        var hasLower = false;
        for (var j = 0; j < password.length; j++) {
          if (password[j] >= "a" && password[j] <= "z") {
            hasLower = true;
          }
        }
        if (!hasLower) {
          passwordProblem = "Must contain at least one lowercase letter";
        }
      }
      if (passwordProblem === "") {
        var hasNumber = false;
        var nums = "0123456789";
        for (var k = 0; k < password.length; k++) {
          if (nums.indexOf(password[k]) !== -1) {
            hasNumber = true;
          }
        }
        if (!hasNumber) {
          passwordProblem = "Must contain at least one number";
        }
      }
      if (passwordProblem === "") {
        var hasSpecial = false;
        var specials = "!@#$%^&*()_+-=[]{}|;:,.<>?/~`";
        for (var m = 0; m < password.length; m++) {
          if (specials.indexOf(password[m]) !== -1) {
            hasSpecial = true;
          }
        }
        if (!hasSpecial) {
          passwordProblem = "Must contain at least one special character";
        }
      }
      if (passwordProblem !== "") {
        passwordError.textContent = passwordProblem;
        passwordError.style.display = "block";
        isValid = false;
      }
    }
    if (confirmPassword === "") {
      confirmError.textContent = "Please confirm your password";
      confirmError.style.display = "block";
      isValid = false;
    } else if (password !== confirmPassword) {
      confirmError.textContent = "Passwords do not match";
      confirmError.style.display = "block";
      isValid = false;
    }
    if (isValid) {
      var userData = {
        firstName: firstName,
        lastName: lastName,
        email: email,
        password: password,
        role: role,
      };
      fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      })
        .then(function (response) {
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          return response.json();
        })
        .then(function (data) {
          if (data.success) {
            successBox.style.display = "block";
            successBox.textContent = "Registration successful!...";
            setTimeout(function () {
              window.location.href = "/login";
            }, 1000);
          } else {
            emailError.textContent = data.message;
            emailError.style.display = "block";
          }
        })
        .catch(function (error) {
          console.error(error);
          emailError.textContent =
            "Server or network error. Is the backend running?";
          emailError.style.display = "block";
        });
    }
  }

  function togglePassword() {
    var passInput = document.getElementById("register-password-input");
    var btn = document.getElementById("toggle-pass-btn");
    if (passInput.type === "password") {
      passInput.type = "text";
      btn.textContent = "🔒";
    } else {
      passInput.type = "password";
      btn.textContent = "👀";
    }
  }

  function toggleConfirmPassword() {
    var confirmInput = document.getElementById("confirm-password-input");
    var btn = document.getElementById("toggle-confirm-btn");
    if (confirmInput.type === "password") {
      confirmInput.type = "text";
      btn.textContent = "🔒";
    } else {
      confirmInput.type = "password";
      btn.textContent = "👀";
    }
  }

  function handlePasswordChange() {
    var passValue = document.getElementById("register-password-input").value;
    var strengthBar = document.getElementById("strength-bar-fill");
    var strengthText = document.getElementById("strength-text");
    var strengthBox = document.getElementById("strength-container");

    if (passValue.length === 0) {
      strengthBox.style.display = "none";
      return;
    }
    strengthBox.style.display = "block";
    var points = 0;
    if (passValue.length >= 8) points = points + 1;
    var hasU = false;
    for (var i = 0; i < passValue.length; i++) {
      if (passValue[i] >= "A" && passValue[i] <= "Z") hasU = true;
    }
    if (hasU) points = points + 1;
    var hasL = false;
    for (var j = 0; j < passValue.length; j++) {
      if (passValue[j] >= "a" && passValue[j] <= "z") hasL = true;
    }
    if (hasL) points = points + 1;
    var hasN = false;
    var digits = "0123456789";
    for (var k = 0; k < passValue.length; k++) {
      if (digits.indexOf(passValue[k]) !== -1) hasN = true;
    }
    if (hasN) points = points + 1;
    var hasS = false;
    var sp = "!@#$%^&*()_+-=[]{}|;:,.<>?/~`";
    for (var m = 0; m < passValue.length; m++) {
      if (sp.indexOf(passValue[m]) !== -1) hasS = true;
    }
    if (hasS) points = points + 1;
    if (points <= 2) {
      strengthBar.style.width = "33%";
      strengthText.textContent = "Password Strength: Weak";
      strengthText.style.color = "#e74c3c";
    } else if (points <= 4) {
      strengthBar.style.width = "66%";
      strengthText.textContent = "Password Strength: Medium";
      strengthText.style.color = "#f39c12";
    } else {
      strengthBar.style.width = "100%";
      strengthText.textContent = "Password Strength: Strong";
      strengthText.style.color = "#27ae60";
    }
  }

  return (
    <div className="register-page">
      <div className="register-left-section">
        <p className="register-app-title">
          <center>AI Education</center>
        </p>
        <h1 className="register-main-heading">
          <center>Empowering Minds with AI Education</center>
        </h1>
        <p className="register-description-text">
          <center>
            AI Education is a emerging technological field that helps to give
            the knowledge of AI to study and gain skills of new things in
            current technological world. We have to adapt and obtain these
            things to our lives to be successful in the future.
          </center>
        </p>
        <ul className="register-features-list">
          <li className="register-feature-item">
            <span className="register-feature-icon">📚</span>
            <span>Smart Learning</span>
          </li>
          <li className="register-feature-item">
            <span className="register-feature-icon">📝</span>
            <span>Track Progress</span>
          </li>
          <li className="register-feature-item">
            <span className="register-feature-icon">🌐</span>
            <span>AI Assistance</span>
          </li>
        </ul>
        <div className="register-illustration-box">
          <img src="src/assets/images.jpeg" alt="AI illustrated image" />
        </div>
      </div>

      <div className="register-right-section">
        <div className="register-card">
          <h2 className="register-welcome-heading">Create Account</h2>
          <p className="register-subtitle-text">
            Please fill in the details to register
          </p>
          <div
            id="success-message"
            className="register-success-message"
            style={{ display: "none" }}
          ></div>
          <form onSubmit={handleRegister}>
            <div className="register-name-row">
              <div className="register-form-group">
                <label htmlFor="first-name-input">First Name</label>
                <input
                  type="text"
                  id="first-name-input"
                  placeholder="First name"
                />
                <p
                  id="first-name-error"
                  className="register-error-message"
                  style={{ display: "none" }}
                ></p>
              </div>
              <div className="register-form-group">
                <label htmlFor="last-name-input">Last Name</label>
                <input
                  type="text"
                  id="last-name-input"
                  placeholder="Last name"
                />
                <p
                  id="last-name-error"
                  className="register-error-message"
                  style={{ display: "none" }}
                ></p>
              </div>
            </div>
            <div className="register-form-group">
              <label htmlFor="register-email-input">Email Address</label>
              <input
                type="email"
                id="register-email-input"
                placeholder="Enter your email"
              />
              <p
                id="email-error"
                className="register-error-message"
                style={{ display: "none" }}
              ></p>
            </div>
            <div className="register-form-group">
              <label htmlFor="register-password-input">Password</label>
              <div className="register-password-wrapper">
                <input
                  type="password"
                  id="register-password-input"
                  placeholder="Create a password"
                  onInput={handlePasswordChange}
                />
                <button
                  type="button"
                  id="toggle-pass-btn"
                  onClick={togglePassword}
                  className="register-toggle-password-btn"
                >
                  🔒
                </button>
              </div>
              <p
                id="password-error"
                className="register-error-message"
                style={{ display: "none" }}
              ></p>
              <div
                id="strength-container"
                className="register-strength-container"
                style={{ display: "none" }}
              >
                <div className="register-strength-bar-background">
                  <div
                    id="strength-bar-fill"
                    className="register-strength-bar-fill"
                    style={{ width: "0%" }}
                  ></div>
                </div>
                <p id="strength-text" className="register-strength-label"></p>
              </div>
            </div>
            <div className="register-form-group">
              <label htmlFor="confirm-password-input">Confirm Password</label>
              <div className="register-password-wrapper">
                <input
                  type="password"
                  id="confirm-password-input"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  id="toggle-confirm-btn"
                  className="register-toggle-password-btn"
                  onClick={toggleConfirmPassword}
                >
                  🔒
                </button>
              </div>
              <p
                id="confirm-password-error"
                className="register-error-message"
                style={{ display: "none" }}
              ></p>
            </div>
            <div className="register-form-group">
              <label htmlFor="role-select">Select Your Role</label>
              <select id="role-select" className="register-role-select">
                <option value="Student">Student</option>
                <option value="Trainer">Trainer</option>
                <option value="Employer">Employer</option>
                <option value="Employee">Employee</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            <button type="submit" className="register-button">
              Register
            </button>
          </form>
          <p className="register-login-text">
            Already have an account?{" "}
            <a href="/login" className="register-login-link">
              Login
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
