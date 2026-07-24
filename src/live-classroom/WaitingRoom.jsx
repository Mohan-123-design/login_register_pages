import "./LiveClassroomRoom.css";

function WaitingRoom({ roomId, onLeave }) {
  return (
    <div className="lcr-root" style={{ alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
      <div style={{ background: "#1e1e28", padding: "40px 60px", borderRadius: "16px", textAlign: "center", boxShadow: "0 12px 40px rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.05)" }}>
        <h2 style={{ fontSize: "24px", fontWeight: "600", color: "#fff", marginBottom: "16px" }}>
          Waiting for Host
        </h2>
        <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.7)", marginBottom: "32px", maxWidth: "300px", lineHeight: "1.5" }}>
          You are in the waiting room for session <strong style={{ color: "#fff" }}>{roomId}</strong>. The trainer will admit you shortly.
        </p>
        
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "32px" }}>
          <div className="lcr-live-dot" style={{ width: "12px", height: "12px", background: "#6366f1", boxShadow: "0 0 10px rgba(99, 102, 241, 0.6)" }} />
        </div>

        <button 
          onClick={onLeave}
          style={{
            background: "rgba(255,255,255,0.1)",
            border: "none",
            padding: "10px 24px",
            borderRadius: "8px",
            color: "#fff",
            fontSize: "14px",
            fontWeight: "500",
            cursor: "pointer",
            transition: "background 0.2s"
          }}
          onMouseOver={(e) => e.target.style.background = "rgba(255,255,255,0.15)"}
          onMouseOut={(e) => e.target.style.background = "rgba(255,255,255,0.1)"}
        >
          Leave
        </button>
      </div>
    </div>
  );
}

export default WaitingRoom;
