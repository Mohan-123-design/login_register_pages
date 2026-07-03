import { useState, useRef, useEffect } from "react";
function ClassroomChat() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "Trainer",
      text: "Welcome to all Team members!",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const bottomOfFeedRef = useRef(null);
  useEffect(function () {
    bottomOfFeedRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSendMessage() {
    var cleanedText = inputText.trim();
    if (cleanedText === "") {
      return;
    }
    var newMessage = {
      id: messages.length + 1,
      sender: "You",
      text: cleanedText,
    };
    setMessages([...messages, newMessage]);
    setInputText("");
  }

  function handleKeyDown(event) {
    if (event.key === "Enter") {
      handleSendMessage();
    }
  }

  function handleInputChange(event) {
    setInputText(event.target.value);
  }
  return (
    <div style={outerWrapperStyle}>
      <div style={headerStyle}>
        <h2 style={headerTitleStyle}>Classroom Chat</h2>
      </div>
      <div style={messageFeedStyle}>
        {messages.map(function (message) {
          var isMe = message.sender === "You";
          return (
            <div
              key={message.id}
              style={isMe ? messageRowRightStyle : messageRowLeftStyle}
            >

              <div style={isMe ? youBubbleStyle : trainerBubbleStyle}>


                <div style={isMe ? youSenderLabelStyle : trainerSenderLabelStyle}>
                  {message.sender}
                </div>


                <div style={messageTextStyle}>
                  {message.text}
                </div>

              </div>
            </div>
          );
        })}
        <div ref={bottomOfFeedRef}></div>
      </div>
      <div style={inputAreaStyle}>
        <input
          type="text"
          value={inputText}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type your message Here..."
          style={inputStyle}
        />
        <button
          onClick={handleSendMessage}
          style={sendButtonStyle}
          onMouseEnter={function (e) {
            e.currentTarget.style.backgroundColor = "#1a56a0";
          }}
          onMouseLeave={function (e) {
            e.currentTarget.style.backgroundColor = "#2166c4";
          }}
        >
          Send
        </button>
      </div>
      <div style={footerHintStyle}>
        Press <strong>Enter</strong> or click <strong>Send</strong> to chat
      </div>
    </div>
  );
}

var outerWrapperStyle = {
  display: "flex",
  flexDirection: "column",
  width: "100%",
  height: "100%",
  fontFamily: "'Segoe UI', Arial, sans-serif",
  borderRadius: "0px",
  overflow: "hidden",
  backgroundColor: "#f5f7fa",
  border: "none",
};

var headerStyle = {
  backgroundColor: "#1a2a4a",
  padding: "16px 20px",
  display: "flex",
  alignItems: "center",
  gap: "10px",
};

var headerTitleStyle = {
  margin: 0,
  fontSize: "17px",
  fontWeight: "700",
  color: "#ffffff",
  letterSpacing: "0.4px",
};

var messageFeedStyle = {
  flex: "1",
  overflowY: "auto",
  padding: "18px 16px",
  display: "flex",
  flexDirection: "column",
  backgroundColor: "#eef1f7",
};

var messageRowLeftStyle = {
  display: "flex",
  justifyContent: "flex-start",
};

var messageRowRightStyle = {
  display: "flex",
  justifyContent: "flex-end",
};

var trainerBubbleStyle = {
  maxWidth: "72%",
  backgroundColor: "#117ddb",
  border: "1px solid #c8d5e8",
  borderRadius: "0px 14px 14px 14px",
  padding: "10px 14px",
  boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
};

var youBubbleStyle = {
  maxWidth: "72%",
  backgroundColor: "#09326c",
  borderRadius: "14px 0px 14px 14px",
  padding: "10px 14px",
  boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
};

var trainerSenderLabelStyle = {
  fontSize: "11px",
  fontWeight: "700",
  color: "#eaedf1",
  marginBottom: "4px",
  textTransform: "uppercase",
  letterSpacing: "0.6px",
};

var youSenderLabelStyle = {
  fontSize: "11px",
  fontWeight: "700",
  color: "rgba(255,255,255,0.65)",
  marginBottom: "4px",
  textTransform: "uppercase",
  letterSpacing: "0.6px",
};

var messageTextStyle = {
  fontSize: "14px",
  lineHeight: "1.55",
  color: "white",
  margin: 0,
  wordBreak: "break-word",
};

var inputAreaStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "14px 16px",
  backgroundColor: "#ffffff",
  borderTop: "1px solid #dde3ec",
};

var inputStyle = {
  flex: 1,
  padding: "10px 14px",
  fontSize: "14px",
  border: "1.5px solid #c0ccdf",
  borderRadius: "8px",
  outline: "none",
  backgroundColor: "#f9fafc",
  color: "#1a2a4a",
  fontFamily: "inherit",
};

var sendButtonStyle = {
  padding: "10px 22px",
  backgroundColor: "#2166c4",
  color: "#ffffff",
  border: "none",
  borderRadius: "8px",
  fontSize: "14px",
  fontWeight: "600",
  cursor: "pointer",
  transition: "background-color 0.18s ease",
  whiteSpace: "nowrap",
};

var footerHintStyle = {
  textAlign: "center",
  fontSize: "11px",
  color: "#8a9ab5",
  padding: "6px 0 12px 0",
  backgroundColor: "#ffffff",
};
var marginStyle = {
  marginTop: "5px",
}
export default ClassroomChat;
