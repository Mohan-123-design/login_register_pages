import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./examanalyticsdashboard.css";

function PassFailDonut({ passPercentage }) {
  var radius = 70;
  var circumference = 2 * Math.PI * radius;
  var passLength = (passPercentage / 100) * circumference;
  return (
    <svg viewBox="0 0 180 180" className="exam-analytics-donut">
      <circle cx="90" cy="90" r={radius} fill="none" stroke="#fdecea" strokeWidth="24" />
      <circle
        cx="90"
        cy="90"
        r={radius}
        fill="none"
        stroke="#1e7e42"
        strokeWidth="24"
        strokeDasharray={passLength + " " + circumference}
        strokeLinecap="round"
        transform="rotate(-90 90 90)"
      />
      <text x="90" y="84" textAnchor="middle" className="exam-analytics-donut-number">
        {passPercentage}%
      </text>
      <text x="90" y="104" textAnchor="middle" className="exam-analytics-donut-label">
        Pass Rate
      </text>
    </svg>
  );
}

function ScoreDistributionBars({ distribution }) {
  var buckets = ["0-25%", "26-50%", "51-75%", "76-100%"];
  var values = buckets.map(function (b) {
    return distribution && distribution[b] ? distribution[b] : 0;
  });
  var maxValue = Math.max.apply(null, values.concat([1]));
  var chartWidth = 400;
  var chartHeight = 200;
  var barWidth = 60;
  var gap = 30;

  return (
    <svg viewBox={"0 0 " + chartWidth + " " + (chartHeight + 30)} className="exam-analytics-bar-chart">
      {buckets.map(function (b, i) {
        var value = values[i];
        var barHeight = (value / maxValue) * (chartHeight - 20);
        var x = i * (barWidth + gap) + 20;
        var y = chartHeight - barHeight;
        return (
          <g key={b}>
            <rect x={x} y={y} width={barWidth} height={barHeight} rx="6" fill="#3a1dde" opacity="0.85" />
            <text x={x + barWidth / 2} y={y - 8} textAnchor="middle" className="exam-analytics-bar-value">
              {value}
            </text>
            <text x={x + barWidth / 2} y={chartHeight + 20} textAnchor="middle" className="exam-analytics-bar-label">
              {b}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function ExamAnalyticsDashboard() {
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

  var params = useParams();
  var navigate = useNavigate();
  var examId = params.id;

  var [exam, setExam] = useState(null);
  var [analytics, setAnalytics] = useState(null);
  var [isLoading, setIsLoading] = useState(true);
  var [errorMessage, setErrorMessage] = useState("");

  function getToken() {
    return localStorage.getItem("token");
  }

  useEffect(function () {
    setIsLoading(true);
    setErrorMessage("");
    fetch("/api/exams/" + examId + "/analytics", {
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
          setExam(data.exam);
          setAnalytics(data.analytics);
        } else {
          setErrorMessage(data.message || "Failed to load analytics.");
        }
      })
      .catch(function (error) {
        console.error("Error fetching analytics:", error);
        setErrorMessage("Server or network error. Is the backend running?");
      })
      .finally(function () {
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="exam-analytics-page">
      <div className="exam-analytics-header">
        <div>
          <h1>Exam Analytics</h1>
          {exam !== null && <p className="exam-analytics-subtitle">{exam.title}</p>}
        </div>
        <div className="exam-analytics-header-actions">
          <button className="exam-analytics-btn" onClick={() => navigate("/admin/exams")}>
            Back to Exams
          </button>
          {exam !== null && (
            <button className="exam-analytics-btn" onClick={() => navigate("/exams/" + examId + "/results")}>
              View Result Summary
            </button>
          )}
        </div>
      </div>

      {isLoading && <div className="exam-analytics-status-msg exam-analytics-loading">Loading analytics...</div>}
      {!isLoading && errorMessage !== "" && (
        <div className="exam-analytics-status-msg exam-analytics-error">{errorMessage}</div>
      )}

      {!isLoading && errorMessage === "" && analytics !== null && (
        <>
          <div className="exam-analytics-stats-grid">
            <div className="exam-analytics-stat-card">
              <div className="exam-analytics-stat-number">{analytics.totalStudents}</div>
              <div className="exam-analytics-stat-label">Total Students</div>
            </div>
            <div className="exam-analytics-stat-card">
              <div className="exam-analytics-stat-number">{analytics.attemptedCount}</div>
              <div className="exam-analytics-stat-label">Attempted</div>
            </div>
            <div className="exam-analytics-stat-card">
              <div className="exam-analytics-stat-number">{analytics.notAttemptedCount}</div>
              <div className="exam-analytics-stat-label">Not Attempted</div>
            </div>
            <div className="exam-analytics-stat-card">
              <div className="exam-analytics-stat-number">{analytics.averageScore}</div>
              <div className="exam-analytics-stat-label">Average Score</div>
            </div>
            <div className="exam-analytics-stat-card">
              <div className="exam-analytics-stat-number">{analytics.highestScore}</div>
              <div className="exam-analytics-stat-label">Highest Score</div>
            </div>
            <div className="exam-analytics-stat-card">
              <div className="exam-analytics-stat-number">{analytics.lowestScore}</div>
              <div className="exam-analytics-stat-label">Lowest Score</div>
            </div>
            <div className="exam-analytics-stat-card">
              <div className="exam-analytics-stat-number">{analytics.completionRate}%</div>
              <div className="exam-analytics-stat-label">Completion Rate</div>
            </div>
          </div>

          <div className="exam-analytics-charts-row">
            <div className="exam-analytics-chart-card">
              <h3>Pass / Fail</h3>
              <PassFailDonut passPercentage={analytics.passPercentage} failPercentage={analytics.failPercentage} />
              <div className="exam-analytics-legend">
                <span>
                  <i className="exam-analytics-dot exam-analytics-dot-pass" /> Pass: {analytics.passCount} (
                  {analytics.passPercentage}%)
                </span>
                <span>
                  <i className="exam-analytics-dot exam-analytics-dot-fail" /> Fail: {analytics.failCount} (
                  {analytics.failPercentage}%)
                </span>
              </div>
            </div>
            <div className="exam-analytics-chart-card">
              <h3>Score Distribution</h3>
              <ScoreDistributionBars distribution={analytics.scoreDistribution} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default ExamAnalyticsDashboard;