import { useState, useRef, useEffect } from "react";
import "./Whiteboard.css";

function Whiteboard(props) {
  let boardId = props.id || "1";
  let currentSessionId = window.sessionStorage.getItem("activeSessionId");
  if (!currentSessionId) {
    currentSessionId = boardId;
  }

  function getToken() {
    return localStorage.getItem("token");
  }

  const canvasRef = useRef(null);
  const canvasAreaRef = useRef(null);
  const historyRef = useRef([]);
  const historyIndexRef = useRef(-1);
  const strokesRef = useRef([]);
  const currentStrokeRef = useRef(null);
  const [currentTool, setCurrentTool] = useState("pen");
  const [brushType, setBrushType] = useState("pen");
  const [thickness, setThickness] = useState(3);
  const [drawColor, setDrawColor] = useState("#000000");
  const [isDrawing, setIsDrawing] = useState(false);
  const [showPenDropdown, setShowPenDropdown] = useState(false);
  const [showShapesDropdown, setShowShapesDropdown] = useState(false);
  const [selectedShape, setSelectedShape] = useState("rectangle");
  const [shapeStartX, setShapeStartX] = useState(0);
  const [shapeStartY, setShapeStartY] = useState(0);
  const [canvasSnapshot, setCanvasSnapshot] = useState(null);
  const [stickyNotes, setStickyNotes] = useState([]);
  const [selectedStickyColor, setSelectedStickyColor] = useState("#fff9b1");
  const [textInputVisible, setTextInputVisible] = useState(false);
  const [textInputX, setTextInputX] = useState(0);
  const [textInputY, setTextInputY] = useState(0);
  const [textInputValue, setTextInputValue] = useState("");
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isHighlight, setIsHighlight] = useState(false);
  let stickyColorList = ["#fff9b1", "#ffb3c6", "#b8f5b1", "#b3d9ff"];

  useEffect(() => {
    let canvas = canvasRef.current;
    let area = canvasAreaRef.current;
    if (canvas && area) {
      canvas.width = area.offsetWidth;
      canvas.height = area.offsetHeight;
      let ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      let firstSnapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
      historyRef.current = [firstSnapshot];
      historyIndexRef.current = 0;
    }
  }, []);
  function replayStroke(ctx, stroke) {
    if (!stroke || !stroke.points || stroke.points.length < 1) {
      return;
    }
    ctx.beginPath();
    ctx.strokeStyle = stroke.color || "#000000";
    ctx.lineWidth = stroke.strokeWidth || 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.globalAlpha = 1.0;

    if (
      stroke.tool === "pen" ||
      stroke.tool === "eraser" ||
      stroke.tool === "pencil" ||
      stroke.tool === "brush"
    ) {
      if (stroke.tool === "eraser") {
        ctx.strokeStyle = "#ffffff";
      }
      if (stroke.tool === "pencil") {
        ctx.globalAlpha = 0.45;
      }
      if (stroke.tool === "brush") {
        ctx.globalAlpha = 0.7;
      }
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let p = 1; p < stroke.points.length; p++) {
        ctx.lineTo(stroke.points[p].x, stroke.points[p].y);
      }
      ctx.stroke();
      ctx.closePath();
      ctx.globalAlpha = 1.0;
    }

    if (stroke.tool === "rectangle") {
      let startPt = stroke.points[0];
      let endPt = stroke.points[stroke.points.length - 1];
      ctx.rect(startPt.x, startPt.y, endPt.x - startPt.x, endPt.y - startPt.y);
      ctx.stroke();
      ctx.closePath();
    }

    if (stroke.tool === "circle") {
      let sp = stroke.points[0];
      let ep = stroke.points[stroke.points.length - 1];
      let rx = (ep.x - sp.x) / 2;
      let ry = (ep.y - sp.y) / 2;
      let cx = sp.x + rx;
      let cy = sp.y + ry;
      let r = Math.sqrt(rx * rx + ry * ry);
      ctx.arc(cx, cy, r, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.closePath();
    }

    if (stroke.tool === "arrow") {
      let arrowStart = stroke.points[0];
      let arrowEnd = stroke.points[stroke.points.length - 1];
      ctx.moveTo(arrowStart.x, arrowStart.y);
      ctx.lineTo(arrowEnd.x, arrowEnd.y);
      ctx.stroke();
      let arrowLen = 14;
      let ang = Math.atan2(
        arrowEnd.y - arrowStart.y,
        arrowEnd.x - arrowStart.x,
      );
      ctx.beginPath();
      ctx.moveTo(arrowEnd.x, arrowEnd.y);
      ctx.lineTo(
        arrowEnd.x - arrowLen * Math.cos(ang - Math.PI / 6),
        arrowEnd.y - arrowLen * Math.sin(ang - Math.PI / 6),
      );
      ctx.moveTo(arrowEnd.x, arrowEnd.y);
      ctx.lineTo(
        arrowEnd.x - arrowLen * Math.cos(ang + Math.PI / 6),
        arrowEnd.y - arrowLen * Math.sin(ang + Math.PI / 6),
      );
      ctx.stroke();
      ctx.closePath();
    }

    if (stroke.tool === "textbox") {
      let pt = stroke.points[0];
      ctx.font = stroke.font || "12px sans-serif";
      if (stroke.isHighlight) {
        let textWidth = ctx.measureText(stroke.text).width;
        ctx.fillStyle = "#ffff00";
        let fontSize = stroke.strokeWidth * 4;
        ctx.fillRect(
          pt.x - 2,
          pt.y - fontSize + 6,
          textWidth + 4,
          fontSize + 4,
        );
      }
      ctx.fillStyle = stroke.color;
      ctx.fillText(stroke.text, pt.x, pt.y);
    }
  }
  useEffect(() => {
    if (!currentSessionId) return;
    let token = getToken();
    if (!token) return;

    fetch("/api/whiteboard/" + currentSessionId, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
    })
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        if (data.success && data.data) {
          let strokes = data.data.strokes || [];
          let stickies = data.data.stickies || [];

          setStickyNotes(stickies);

          let canvas = canvasRef.current;
          if (canvas) {
            let ctx = canvas.getContext("2d");
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            let validStrokes = [];
            for (let i = 0; i < strokes.length; i++) {
              if (strokes[i].drawingData) {
                replayStroke(ctx, strokes[i].drawingData);
                validStrokes.push(strokes[i].drawingData);
              }
            }
            strokesRef.current = validStrokes;
            saveToHistory();
          }
        }
      })
      .catch((err) => {
        console.log("could not load saved whiteboard data", err);
      });
  }, [currentSessionId]);

  useEffect(() => {
    let sock = props.socketRef && props.socketRef.current;
    if (!sock) return;

    const handleStroke = (stroke) => {
      if (!stroke) return;
      let canvas = canvasRef.current;
      if (canvas) {
        let ctx = canvas.getContext("2d");
        replayStroke(ctx, stroke);
        strokesRef.current.push(stroke);
        saveToHistory();
      }
    };

    const handleSticky = (data) => {
      if (!data) return;
      if (data.action === "add") {
        setStickyNotes((prev) => [...prev, data.sticky]);
      } else if (data.action === "update") {
        setStickyNotes((prev) =>
          prev.map((note) =>
            note.id === data.sticky.noteId || note.noteId === data.sticky.noteId
              ? { ...note, ...data.sticky }
              : note,
          ),
        );
      } else if (data.action === "remove") {
        setStickyNotes((prev) =>
          prev.filter(
            (note) => note.id !== data.noteId && note.noteId !== data.noteId,
          ),
        );
      }
    };

    sock.on("whiteboard:stroke", handleStroke);
    sock.on("whiteboard:sticky", handleSticky);

    return function () {
      sock.off("whiteboard:stroke", handleStroke);
      sock.off("whiteboard:sticky", handleSticky);
    };
  }, [props.socketRef]);

  function saveToBackend() {
    alert(
      "Saving is now real-time and automatic! You don't need to save manually.",
    );
  }

  function saveToHistory() {
    let canvas = canvasRef.current;
    if (canvas) {
      let ctx = canvas.getContext("2d");
      let snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let currentIndex = historyIndexRef.current;
      let newHistory = [];
      for (let i = 0; i <= currentIndex; i++) {
        newHistory.push(historyRef.current[i]);
      }
      newHistory.push(snapshot);
      if (newHistory.length > 50) {
        newHistory.shift();
      }
      historyRef.current = newHistory;
      historyIndexRef.current = newHistory.length - 1;
    }
  }

  function handleUndo() {
    let currentIndex = historyIndexRef.current;
    if (currentIndex > 0) {
      currentIndex = currentIndex - 1;
      historyIndexRef.current = currentIndex;
      let canvas = canvasRef.current;
      let ctx = canvas.getContext("2d");
      ctx.putImageData(historyRef.current[currentIndex], 0, 0);
    }
  }

  function handleRedo() {
    let currentIndex = historyIndexRef.current;
    if (currentIndex < historyRef.current.length - 1) {
      currentIndex = currentIndex + 1;
      historyIndexRef.current = currentIndex;
      let canvas = canvasRef.current;
      let ctx = canvas.getContext("2d");
      ctx.putImageData(historyRef.current[currentIndex], 0, 0);
    }
  }

  function getBrushSettings() {
    let settings = {};
    if (brushType === "pen") {
      settings.lineWidth = thickness;
      settings.globalAlpha = 1.0;
      settings.lineCap = "round";
    } else if (brushType === "pencil") {
      settings.lineWidth = Math.max(1, thickness - 1);
      settings.globalAlpha = 0.45;
      settings.lineCap = "round";
    } else if (brushType === "brush") {
      settings.lineWidth = thickness + 4;
      settings.globalAlpha = 0.7;
      settings.lineCap = "round";
    } else {
      settings.lineWidth = thickness;
      settings.globalAlpha = 1.0;
      settings.lineCap = "round";
    }
    return settings;
  }

  function handleMouseDown(e) {
    let canvas = canvasRef.current;
    let rect = canvas.getBoundingClientRect();
    let mouseX = e.clientX - rect.left;
    let mouseY = e.clientY - rect.top;

    if (currentTool === "sticky") {
      let newNote = {
        id: Date.now(),
        x: mouseX,
        y: mouseY,
        color: selectedStickyColor,
        text: "",
      };
      let updatedNotes = [];
      for (let i = 0; i < stickyNotes.length; i++) {
        updatedNotes.push(stickyNotes[i]);
      }
      updatedNotes.push(newNote);
      setStickyNotes(updatedNotes);
      let sock = props.socketRef && props.socketRef.current;
      if (sock) {
        sock.emit("whiteboard:sticky", { action: "add", sticky: newNote });
      }
      return;
    }

    if (currentTool === "textbox") {
      setTimeout(() => {
        setTextInputX(mouseX);
        setTextInputY(mouseY);
        setTextInputValue("");
        setTextInputVisible(true);
      }, 50);
      return;
    }

    setIsDrawing(true);
    let ctx = canvas.getContext("2d");
    currentStrokeRef.current = {
      tool: currentTool,
      color: drawColor,
      strokeWidth: currentTool === "eraser" ? thickness + 8 : thickness,
      brushType: brushType,
      points: [{ x: mouseX, y: mouseY }],
    };

    if (
      currentTool === "rectangle" ||
      currentTool === "circle" ||
      currentTool === "arrow"
    ) {
      setShapeStartX(mouseX);
      setShapeStartY(mouseY);
      let snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setCanvasSnapshot(snapshot);
      return;
    }

    let brushSettings = getBrushSettings();
    ctx.globalAlpha = brushSettings.globalAlpha;
    ctx.lineWidth = brushSettings.lineWidth;
    ctx.lineCap = brushSettings.lineCap;
    ctx.lineJoin = "round";

    if (currentTool === "eraser") {
      ctx.strokeStyle = "#ffffff";
      ctx.globalAlpha = 1.0;
      ctx.lineWidth = thickness + 8;
    } else {
      ctx.strokeStyle = drawColor;
    }

    ctx.beginPath();
    ctx.moveTo(mouseX, mouseY);
  }

  function handleMouseMove(e) {
    if (!isDrawing) {
      return;
    }

    let canvas = canvasRef.current;
    let ctx = canvas.getContext("2d");
    let rect = canvas.getBoundingClientRect();
    let mouseX = e.clientX - rect.left;
    let mouseY = e.clientY - rect.top;

    if (
      currentTool === "rectangle" ||
      currentTool === "circle" ||
      currentTool === "arrow"
    ) {
      if (canvasSnapshot) {
        ctx.putImageData(canvasSnapshot, 0, 0);
      }
      ctx.strokeStyle = drawColor;
      ctx.lineWidth = thickness;
      ctx.globalAlpha = 1.0;
      ctx.lineCap = "round";

      if (currentTool === "rectangle") {
        let rectWidth = mouseX - shapeStartX;
        let rectHeight = mouseY - shapeStartY;
        ctx.beginPath();
        ctx.rect(shapeStartX, shapeStartY, rectWidth, rectHeight);
        ctx.stroke();
      }

      if (currentTool === "circle") {
        let radiusX = (mouseX - shapeStartX) / 2;
        let radiusY = (mouseY - shapeStartY) / 2;
        let centerX = shapeStartX + radiusX;
        let centerY = shapeStartY + radiusY;
        let radius = Math.sqrt(radiusX * radiusX + radiusY * radiusY);
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.stroke();
      }

      if (currentTool === "arrow") {
        ctx.beginPath();
        ctx.moveTo(shapeStartX, shapeStartY);
        ctx.lineTo(mouseX, mouseY);
        ctx.stroke();
        let arrowLength = 14;
        let angle = Math.atan2(mouseY - shapeStartY, mouseX - shapeStartX);
        ctx.beginPath();
        ctx.moveTo(mouseX, mouseY);
        ctx.lineTo(
          mouseX - arrowLength * Math.cos(angle - Math.PI / 6),
          mouseY - arrowLength * Math.sin(angle - Math.PI / 6),
        );
        ctx.moveTo(mouseX, mouseY);
        ctx.lineTo(
          mouseX - arrowLength * Math.cos(angle + Math.PI / 6),
          mouseY - arrowLength * Math.sin(angle + Math.PI / 6),
        );
        ctx.stroke();
      }
      return;
    }
    ctx.lineTo(mouseX, mouseY);
    ctx.stroke();
    if (currentStrokeRef.current) {
      currentStrokeRef.current.points.push({ x: mouseX, y: mouseY });
    }
  }

  function handleMouseUp(e) {
    if (isDrawing) {
      setIsDrawing(false);
      let canvas = canvasRef.current;
      let ctx = canvas.getContext("2d");
      if (currentStrokeRef.current && e) {
        let rect = canvas.getBoundingClientRect();
        let endX = e.clientX - rect.left;
        let endY = e.clientY - rect.top;
        if (
          currentStrokeRef.current.tool === "rectangle" ||
          currentStrokeRef.current.tool === "circle" ||
          currentStrokeRef.current.tool === "arrow"
        ) {
          currentStrokeRef.current.points.push({ x: endX, y: endY });
        }
      }
      if (
        currentStrokeRef.current &&
        currentStrokeRef.current.points.length > 0
      ) {
        strokesRef.current.push(currentStrokeRef.current);
        let sock = props.socketRef && props.socketRef.current;
        if (sock) {
          sock.emit("whiteboard:stroke", currentStrokeRef.current);
        }
      }
      currentStrokeRef.current = null;

      ctx.closePath();
      ctx.globalAlpha = 1.0;
      setCanvasSnapshot(null);
      saveToHistory();
    }
  }

  function handleTextSubmit(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      e.target.blur();
    }
  }

  function handleClearCanvas() {
    let canvas = canvasRef.current;
    if (canvas) {
      let ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      saveToHistory();
      setStickyNotes([]);
      strokesRef.current = [];
      currentStrokeRef.current = null;
    }
  }

  function removeStickyNote(noteId) {
    let remaining = [];
    for (let i = 0; i < stickyNotes.length; i++) {
      if (stickyNotes[i].id !== noteId) {
        remaining.push(stickyNotes[i]);
      }
    }
    setStickyNotes(remaining);
    let sock = props.socketRef && props.socketRef.current;
    if (sock) {
      sock.emit("whiteboard:sticky", { action: "remove", noteId: noteId });
    }
  }

  function updateStickyText(noteId, newText) {
    let updated = [];
    for (let i = 0; i < stickyNotes.length; i++) {
      if (stickyNotes[i].id === noteId || stickyNotes[i].noteId === noteId) {
        let copy = {
          ...stickyNotes[i],
          text: newText,
        };
        updated.push(copy);
      } else {
        updated.push(stickyNotes[i]);
      }
    }
    setStickyNotes(updated);
  }

  function handleStickyBlur(noteId) {
    let note = stickyNotes.find((n) => n.id === noteId || n.noteId === noteId);
    if (note) {
      let sock = props.socketRef && props.socketRef.current;
      if (sock) {
        sock.emit("whiteboard:sticky", { action: "update", sticky: note });
      }
    }
  }

  function selectBrushType(type) {
    setBrushType(type);
    setCurrentTool("pen");
    setShowPenDropdown(false);
    if (type === "pen") {
      setThickness(3);
    } else if (type === "pencil") {
      setThickness(2);
    } else if (type === "brush") {
      setThickness(6);
    }
  }

  function selectShape(shape) {
    setCurrentTool(shape);
    setSelectedShape(shape);
    setShowShapesDropdown(false);
  }

  function togglePenDropdown() {
    setShowPenDropdown(!showPenDropdown);
    setShowShapesDropdown(false);
  }

  function toggleShapesDropdown() {
    setShowShapesDropdown(!showShapesDropdown);
    setShowPenDropdown(false);
  }

  function getBrushDisplayName() {
    if (brushType === "pen") return "Pen";
    if (brushType === "pencil") return "Pencil";
    if (brushType === "brush") return "Brush";
    return "Pen";
  }

  function getShapeDisplayName() {
    if (selectedShape === "rectangle") return "Rectangle";
    if (selectedShape === "circle") return "Circle";
    if (selectedShape === "arrow") return "Arrow";
    if (selectedShape === "textbox") return "Text Box";
    return "Shapes";
  }

  function isToolActive(toolName) {
    if (currentTool === toolName) return true;
    return false;
  }

  function isPenActive() {
    if (currentTool === "pen") return true;
    return false;
  }

  function isShapeActive() {
    if (currentTool === "rectangle") return true;
    if (currentTool === "circle") return true;
    if (currentTool === "arrow") return true;
    if (currentTool === "textbox") return true;
    return false;
  }

  function handleThicknessChange(e) {
    let val = Number(e.target.value);
    if (val < 1) val = 1;
    if (val > 50) val = 50;
    setThickness(val);
  }

  function buildFontString() {
    let fontStyle = "";
    if (isItalic) {
      fontStyle = fontStyle + "italic ";
    }
    if (isBold) {
      fontStyle = fontStyle + "bold ";
    }
    fontStyle = fontStyle + thickness * 4 + "px Segoe UI, Arial, sans-serif";
    return fontStyle;
  }

  function handleColorChange(e) {
    setDrawColor(e.target.value);
  }

  return (
    <div className="whiteboard-container">
      <div className="whiteboard-toolbar">
        <div className="dropdown-wrapper">
          <button
            className={"tool-button" + (isPenActive() ? " active-tool" : "")}
            onClick={togglePenDropdown}
            title={getBrushDisplayName()}
          >
            🖊️ ▾
          </button>
          {showPenDropdown && (
            <div className="dropdown-menu">
              <button
                className={
                  "dropdown-item" +
                  (brushType === "pen" ? " selected-item" : "")
                }
                onClick={() => {
                  selectBrushType("pen");
                }}
              >
                ✒️ Pen
              </button>
              <button
                className={
                  "dropdown-item" +
                  (brushType === "pencil" ? " selected-item" : "")
                }
                onClick={() => {
                  selectBrushType("pencil");
                }}
              >
                ✏️ Pencil
              </button>
              <button
                className={
                  "dropdown-item" +
                  (brushType === "brush" ? " selected-item" : "")
                }
                onClick={() => {
                  selectBrushType("brush");
                }}
              >
                🖌️ Brush
              </button>
            </div>
          )}
        </div>
        <button
          className={
            "tool-button" + (isToolActive("eraser") ? " active-tool" : "")
          }
          onClick={() => {
            setCurrentTool("eraser");
            setShowPenDropdown(false);
            setShowShapesDropdown(false);
          }}
          title="Eraser"
        >
          🧹
        </button>
        <div className="dropdown-wrapper">
          <button
            className={"tool-button" + (isShapeActive() ? " active-tool" : "")}
            onClick={toggleShapesDropdown}
            title={getShapeDisplayName()}
          >
            🔷 ▾
          </button>
          {showShapesDropdown && (
            <div className="dropdown-menu">
              <button
                className={
                  "dropdown-item" +
                  (selectedShape === "rectangle" ? " selected-item" : "")
                }
                onClick={() => {
                  selectShape("rectangle");
                }}
              >
                ▭ Rectangle
              </button>
              <button
                className={
                  "dropdown-item" +
                  (selectedShape === "circle" ? " selected-item" : "")
                }
                onClick={() => {
                  selectShape("circle");
                }}
              >
                ⭕ Circle
              </button>
              <button
                className={
                  "dropdown-item" +
                  (selectedShape === "arrow" ? " selected-item" : "")
                }
                onClick={() => {
                  selectShape("arrow");
                }}
              >
                ➡️ Arrow
              </button>
              <button
                className={
                  "dropdown-item" +
                  (selectedShape === "textbox" ? " selected-item" : "")
                }
                onClick={() => {
                  selectShape("textbox");
                }}
              >
                📝 Text Box
              </button>
            </div>
          )}
        </div>
        <button
          className={
            "tool-button" + (isToolActive("sticky") ? " active-tool" : "")
          }
          onClick={() => {
            setCurrentTool("sticky");
            setShowPenDropdown(false);
            setShowShapesDropdown(false);
          }}
          title="Sticky Note"
        >
          📌
        </button>
        {currentTool === "sticky" && (
          <div className="sticky-colors">
            {stickyColorList.map((color, index) => {
              return (
                <div
                  key={index}
                  className={
                    "sticky-color-box" +
                    (selectedStickyColor === color ? " selected-sticky" : "")
                  }
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    setSelectedStickyColor(color);
                  }}
                ></div>
              );
            })}
          </div>
        )}
        <div className="toolbar-separator"></div>
        <input
          type="number"
          min="1"
          max="50"
          value={thickness}
          onChange={handleThicknessChange}
          className="size-number-input"
          title="Size"
        />
        <input
          type="color"
          value={drawColor}
          onChange={handleColorChange}
          className="color-picker-input"
          title="Color"
        />
        <div className="toolbar-separator"></div>
        <button
          className={
            "tool-button font-style-btn" + (isBold ? " active-tool" : "")
          }
          onClick={() => {
            setIsBold(!isBold);
          }}
          title="Bold"
        >
          <strong>B</strong>
        </button>
        <button
          className={
            "tool-button font-style-btn" + (isItalic ? " active-tool" : "")
          }
          onClick={() => {
            setIsItalic(!isItalic);
          }}
          title="Italic"
        >
          <em>I</em>
        </button>
        <button
          className={
            "tool-button font-style-btn" + (isHighlight ? " active-tool" : "")
          }
          onClick={() => {
            setIsHighlight(!isHighlight);
          }}
          title="Highlight"
        >
          🖍️
        </button>
        <div className="toolbar-separator"></div>
        <button className="tool-button" onClick={handleUndo} title="Undo">
          ↩️
        </button>
        <button className="tool-button" onClick={handleRedo} title="Redo">
          ↪️
        </button>
        <button
          className="clear-button"
          onClick={handleClearCanvas}
          title="Clear All"
        >
          🗑️
        </button>
        <button
          className="tool-button"
          onClick={saveToBackend}
          title="Save to Server"
        >
          Save
        </button>
      </div>
      <div className="canvas-area" ref={canvasAreaRef}>
        <canvas
          ref={canvasRef}
          className="drawing-canvas"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        ></canvas>
        {stickyNotes.map((note) => {
          return (
            <div
              key={note.id}
              className="sticky-note"
              style={{
                left: note.x + "px",
                top: note.y + "px",
                backgroundColor: note.color,
              }}
            >
              <button
                className="sticky-note-close"
                onClick={() => {
                  removeStickyNote(note.id);
                }}
              >
                ×
              </button>
              <textarea
                className="sticky-note-text"
                value={note.text}
                placeholder="Type note..."
                onChange={(e) => {
                  updateStickyText(note.id || note.noteId, e.target.value);
                }}
                onBlur={() => {
                  handleStickyBlur(note.id || note.noteId);
                }}
              ></textarea>
            </div>
          );
        })}
        {textInputVisible && (
          <input
            type="text"
            className="canvas-text-input"
            style={{ left: textInputX + "px", top: textInputY + "px" }}
            value={textInputValue}
            autoFocus
            placeholder="Type text & press Enter"
            onChange={(e) => {
              setTextInputValue(e.target.value);
            }}
            onKeyDown={handleTextSubmit}
            onBlur={() => {
              if (textInputValue.trim() !== "") {
                let canvas = canvasRef.current;
                let ctx = canvas.getContext("2d");
                let fontSize = thickness * 4;
                ctx.font = buildFontString();
                ctx.globalAlpha = 1.0;
                if (isHighlight) {
                  let textWidth = ctx.measureText(textInputValue).width;
                  ctx.fillStyle = "#ffff00";
                  ctx.fillRect(
                    textInputX - 2,
                    textInputY - fontSize + 6,
                    textWidth + 4,
                    fontSize + 4,
                  );
                }
                ctx.fillStyle = drawColor;
                ctx.fillText(textInputValue, textInputX, textInputY + 16);

                let newTextStroke = {
                  tool: "textbox",
                  color: drawColor,
                  strokeWidth: thickness,
                  brushType: "pen",
                  points: [{ x: textInputX, y: textInputY + 16 }],
                  text: textInputValue,
                  isHighlight: isHighlight,
                  font: ctx.font,
                };
                strokesRef.current.push(newTextStroke);
                let sock = props.socketRef && props.socketRef.current;
                if (sock) {
                  sock.emit("whiteboard:stroke", newTextStroke);
                }

                saveToHistory();
              }
              setTextInputVisible(false);
              setTextInputValue("");
            }}
          />
        )}
      </div>
    </div>
  );
}

export default Whiteboard;
