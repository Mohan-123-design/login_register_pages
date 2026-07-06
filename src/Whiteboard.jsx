import { useState, useRef, useEffect } from 'react';
import './Whiteboard.css';

function Whiteboard(props) {
  var boardId = props.id || '1';
  var dataKey = 'whiteboardData_' + boardId;
  var notesKey = 'whiteboardStickyNotes_' + boardId;
  var canvasRef = useRef(null);
  var canvasAreaRef = useRef(null);
  var historyRef = useRef([]);
  var historyIndexRef = useRef(-1);
  var [currentTool, setCurrentTool] = useState('pen');
  var [brushType, setBrushType] = useState('pen');
  var [thickness, setThickness] = useState(3);
  var [drawColor, setDrawColor] = useState('#000000');
  var [isDrawing, setIsDrawing] = useState(false);
  var [showPenDropdown, setShowPenDropdown] = useState(false);
  var [showShapesDropdown, setShowShapesDropdown] = useState(false);
  var [selectedShape, setSelectedShape] = useState('rectangle');
  var [shapeStartX, setShapeStartX] = useState(0);
  var [shapeStartY, setShapeStartY] = useState(0);
  var [canvasSnapshot, setCanvasSnapshot] = useState(null);
  var [stickyNotes, setStickyNotes] = useState([]);
  var [selectedStickyColor, setSelectedStickyColor] = useState('#fff9b1');
  var [textInputVisible, setTextInputVisible] = useState(false);
  var [textInputX, setTextInputX] = useState(0);
  var [textInputY, setTextInputY] = useState(0);
  var [textInputValue, setTextInputValue] = useState('');
  var [isBold, setIsBold] = useState(false);
  var [isItalic, setIsItalic] = useState(false);
  var [isHighlight, setIsHighlight] = useState(false);
  var stickyColorList = ['#fff9b1', '#ffb3c6', '#b8f5b1', '#b3d9ff'];

  useEffect(function () {
    var canvas = canvasRef.current;
    var area = canvasAreaRef.current;
    if (canvas && area) {
      canvas.width = area.offsetWidth;
      canvas.height = area.offsetHeight;
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      var savedData = localStorage.getItem(dataKey);
      if (savedData) {
        var img = new Image();
        img.onload = function () {
          ctx.drawImage(img, 0, 0);
          var firstSnapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
          historyRef.current = [firstSnapshot];
          historyIndexRef.current = 0;
        };
        img.src = savedData;
      } else {
        var firstSnapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
        historyRef.current = [firstSnapshot];
        historyIndexRef.current = 0;
      }
    }
  }, []);

  useEffect(function () {
    var savedNotes = localStorage.getItem(notesKey);
    if (savedNotes) {
      try {
        var parsed = JSON.parse(savedNotes);
        setStickyNotes(parsed);
      } catch (err) {
      }
    }
  }, []);

  useEffect(function () {
    localStorage.setItem(notesKey, JSON.stringify(stickyNotes));
  }, [stickyNotes, notesKey]);

  function saveCanvasToStorage() {
    var canvas = canvasRef.current;
    if (canvas) {
      var dataUrl = canvas.toDataURL();
      localStorage.setItem(dataKey, dataUrl);
    }
  }

  function saveToHistory() {
    var canvas = canvasRef.current;
    if (canvas) {
      var ctx = canvas.getContext('2d');
      var snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
      var currentIndex = historyIndexRef.current;
      var newHistory = [];
      for (var i = 0; i <= currentIndex; i++) {
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
    var currentIndex = historyIndexRef.current;
    if (currentIndex > 0) {
      currentIndex = currentIndex - 1;
      historyIndexRef.current = currentIndex;
      var canvas = canvasRef.current;
      var ctx = canvas.getContext('2d');
      ctx.putImageData(historyRef.current[currentIndex], 0, 0);
      saveCanvasToStorage();
    }
  }

  function handleRedo() {
    var currentIndex = historyIndexRef.current;
    if (currentIndex < historyRef.current.length - 1) {
      currentIndex = currentIndex + 1;
      historyIndexRef.current = currentIndex;
      var canvas = canvasRef.current;
      var ctx = canvas.getContext('2d');
      ctx.putImageData(historyRef.current[currentIndex], 0, 0);
      saveCanvasToStorage();
    }
  }

  function getBrushSettings() {
    var settings = {};
    if (brushType === 'pen') {
      settings.lineWidth = thickness;
      settings.globalAlpha = 1.0;
      settings.lineCap = 'round';
    } else if (brushType === 'pencil') {
      settings.lineWidth = Math.max(1, thickness - 1);
      settings.globalAlpha = 0.45;
      settings.lineCap = 'round';
    } else if (brushType === 'brush') {
      settings.lineWidth = thickness + 4;
      settings.globalAlpha = 0.7;
      settings.lineCap = 'round';
    } else {
      settings.lineWidth = thickness;
      settings.globalAlpha = 1.0;
      settings.lineCap = 'round';
    }
    return settings;
  }

  function handleMouseDown(e) {
    var canvas = canvasRef.current;
    var rect = canvas.getBoundingClientRect();
    var mouseX = e.clientX - rect.left;
    var mouseY = e.clientY - rect.top;

    if (currentTool === 'sticky') {
      var newNote = {
        id: Date.now(),
        x: mouseX,
        y: mouseY,
        color: selectedStickyColor,
        text: '',
      };
      var updatedNotes = [];
      for (var i = 0; i < stickyNotes.length; i++) {
        updatedNotes.push(stickyNotes[i]);
      }
      updatedNotes.push(newNote);
      setStickyNotes(updatedNotes);
      return;
    }

    if (currentTool === 'textbox') {
      setTimeout(function () {
        setTextInputX(mouseX);
        setTextInputY(mouseY);
        setTextInputValue('');
        setTextInputVisible(true);
      }, 50);
      return;
    }

    setIsDrawing(true);
    var ctx = canvas.getContext('2d');
    if (currentTool === 'rectangle' || currentTool === 'circle' || currentTool === 'arrow') {
      setShapeStartX(mouseX);
      setShapeStartY(mouseY);
      var snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setCanvasSnapshot(snapshot);
      return;
    }

    var brushSettings = getBrushSettings();
    ctx.globalAlpha = brushSettings.globalAlpha;
    ctx.lineWidth = brushSettings.lineWidth;
    ctx.lineCap = brushSettings.lineCap;
    ctx.lineJoin = 'round';

    if (currentTool === 'eraser') {
      ctx.strokeStyle = '#ffffff';
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

    var canvas = canvasRef.current;
    var ctx = canvas.getContext('2d');
    var rect = canvas.getBoundingClientRect();
    var mouseX = e.clientX - rect.left;
    var mouseY = e.clientY - rect.top;

    if (currentTool === 'rectangle' || currentTool === 'circle' || currentTool === 'arrow') {
      if (canvasSnapshot) {
        ctx.putImageData(canvasSnapshot, 0, 0);
      }
      ctx.strokeStyle = drawColor;
      ctx.lineWidth = thickness;
      ctx.globalAlpha = 1.0;
      ctx.lineCap = 'round';

      if (currentTool === 'rectangle') {
        var rectWidth = mouseX - shapeStartX;
        var rectHeight = mouseY - shapeStartY;
        ctx.beginPath();
        ctx.rect(shapeStartX, shapeStartY, rectWidth, rectHeight);
        ctx.stroke();
      }

      if (currentTool === 'circle') {
        var radiusX = (mouseX - shapeStartX) / 2;
        var radiusY = (mouseY - shapeStartY) / 2;
        var centerX = shapeStartX + radiusX;
        var centerY = shapeStartY + radiusY;
        var radius = Math.sqrt(radiusX * radiusX + radiusY * radiusY);
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.stroke();
      }

      if (currentTool === 'arrow') {
        ctx.beginPath();
        ctx.moveTo(shapeStartX, shapeStartY);
        ctx.lineTo(mouseX, mouseY);
        ctx.stroke();
        var arrowLength = 14;
        var angle = Math.atan2(mouseY - shapeStartY, mouseX - shapeStartX);
        ctx.beginPath();
        ctx.moveTo(mouseX, mouseY);
        ctx.lineTo(
          mouseX - arrowLength * Math.cos(angle - Math.PI / 6),
          mouseY - arrowLength * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(mouseX, mouseY);
        ctx.lineTo(
          mouseX - arrowLength * Math.cos(angle + Math.PI / 6),
          mouseY - arrowLength * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
      }
      return;
    }
    ctx.lineTo(mouseX, mouseY);
    ctx.stroke();
  }

  function handleMouseUp() {
    if (isDrawing) {
      setIsDrawing(false);
      var canvas = canvasRef.current;
      var ctx = canvas.getContext('2d');
      ctx.closePath();
      ctx.globalAlpha = 1.0;
      setCanvasSnapshot(null);
      saveCanvasToStorage();
      saveToHistory();
    }
  }

  function handleTextSubmit(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.target.blur();
    }
  }

  function handleClearCanvas() {
    var canvas = canvasRef.current;
    if (canvas) {
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      saveCanvasToStorage();
      saveToHistory();
      setStickyNotes([]);
    }
  }

  function removeStickyNote(noteId) {
    var remaining = [];
    for (var i = 0; i < stickyNotes.length; i++) {
      if (stickyNotes[i].id !== noteId) {
        remaining.push(stickyNotes[i]);
      }
    }
    setStickyNotes(remaining);
  }

  function updateStickyText(noteId, newText) {
    var updated = [];
    for (var i = 0; i < stickyNotes.length; i++) {
      if (stickyNotes[i].id === noteId) {
        var copy = {
          id: stickyNotes[i].id,
          x: stickyNotes[i].x,
          y: stickyNotes[i].y,
          color: stickyNotes[i].color,
          text: newText,
        };
        updated.push(copy);
      } else {
        updated.push(stickyNotes[i]);
      }
    }
    setStickyNotes(updated);
  }

  function selectBrushType(type) {
    setBrushType(type);
    setCurrentTool('pen');
    setShowPenDropdown(false);
    if (type === 'pen') {
      setThickness(3);
    } else if (type === 'pencil') {
      setThickness(2);
    } else if (type === 'brush') {
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
    if (brushType === 'pen') return 'Pen';
    if (brushType === 'pencil') return 'Pencil';
    if (brushType === 'brush') return 'Brush';
    return 'Pen';
  }

  function getShapeDisplayName() {
    if (selectedShape === 'rectangle') return 'Rectangle';
    if (selectedShape === 'circle') return 'Circle';
    if (selectedShape === 'arrow') return 'Arrow';
    if (selectedShape === 'textbox') return 'Text Box';
    return 'Shapes';
  }

  function isToolActive(toolName) {
    if (currentTool === toolName) return true;
    return false;
  }

  function isPenActive() {
    if (currentTool === 'pen') return true;
    return false;
  }

  function isShapeActive() {
    if (currentTool === 'rectangle') return true;
    if (currentTool === 'circle') return true;
    if (currentTool === 'arrow') return true;
    if (currentTool === 'textbox') return true;
    return false;
  }

  function handleThicknessChange(e) {
    var val = Number(e.target.value);
    if (val < 1) val = 1;
    if (val > 50) val = 50;
    setThickness(val);
  }

  function buildFontString() {
    var fontStyle = '';
    if (isItalic) {
      fontStyle = fontStyle + 'italic ';
    }
    if (isBold) {
      fontStyle = fontStyle + 'bold ';
    }
    fontStyle = fontStyle + (thickness * 4) + 'px Segoe UI, Arial, sans-serif';
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
            className={'tool-button' + (isPenActive() ? ' active-tool' : '')}
            onClick={togglePenDropdown}
            title={getBrushDisplayName()}
          >
            🖊️ ▾
          </button>
          {showPenDropdown && (
            <div className="dropdown-menu">
              <button
                className={'dropdown-item' + (brushType === 'pen' ? ' selected-item' : '')}
                onClick={function () { selectBrushType('pen'); }}
              >
                ✒️ Pen
              </button>
              <button
                className={'dropdown-item' + (brushType === 'pencil' ? ' selected-item' : '')}
                onClick={function () { selectBrushType('pencil'); }}
              >
                ✏️ Pencil
              </button>
              <button
                className={'dropdown-item' + (brushType === 'brush' ? ' selected-item' : '')}
                onClick={function () { selectBrushType('brush'); }}
              >
                🖌️ Brush
              </button>
            </div>
          )}
        </div>
        <button
          className={'tool-button' + (isToolActive('eraser') ? ' active-tool' : '')}
          onClick={function () { setCurrentTool('eraser'); setShowPenDropdown(false); setShowShapesDropdown(false); }}
          title="Eraser"
        >
          🧹
        </button>
        <div className="dropdown-wrapper">
          <button
            className={'tool-button' + (isShapeActive() ? ' active-tool' : '')}
            onClick={toggleShapesDropdown}
            title={getShapeDisplayName()}
          >
            🔷 ▾
          </button>
          {showShapesDropdown && (
            <div className="dropdown-menu">
              <button
                className={'dropdown-item' + (selectedShape === 'rectangle' ? ' selected-item' : '')}
                onClick={function () { selectShape('rectangle'); }}
              >
                ▭ Rectangle
              </button>
              <button
                className={'dropdown-item' + (selectedShape === 'circle' ? ' selected-item' : '')}
                onClick={function () { selectShape('circle'); }}
              >
                ⭕ Circle
              </button>
              <button
                className={'dropdown-item' + (selectedShape === 'arrow' ? ' selected-item' : '')}
                onClick={function () { selectShape('arrow'); }}
              >
                ➡️ Arrow
              </button>
              <button
                className={'dropdown-item' + (selectedShape === 'textbox' ? ' selected-item' : '')}
                onClick={function () { selectShape('textbox'); }}
              >
                📝 Text Box
              </button>
            </div>
          )}
        </div>
        <button
          className={'tool-button' + (isToolActive('sticky') ? ' active-tool' : '')}
          onClick={function () { setCurrentTool('sticky'); setShowPenDropdown(false); setShowShapesDropdown(false); }}
          title="Sticky Note"
        >
          📌
        </button>
        {currentTool === 'sticky' && (
          <div className="sticky-colors">
            {stickyColorList.map(function (color, index) {
              return (
                <div
                  key={index}
                  className={'sticky-color-box' + (selectedStickyColor === color ? ' selected-sticky' : '')}
                  style={{ backgroundColor: color }}
                  onClick={function () { setSelectedStickyColor(color); }}
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
          className={'tool-button font-style-btn' + (isBold ? ' active-tool' : '')}
          onClick={function () { setIsBold(!isBold); }}
          title="Bold"
        >
          <strong>B</strong>
        </button>
        <button
          className={'tool-button font-style-btn' + (isItalic ? ' active-tool' : '')}
          onClick={function () { setIsItalic(!isItalic); }}
          title="Italic"
        >
          <em>I</em>
        </button>
        <button
          className={'tool-button font-style-btn' + (isHighlight ? ' active-tool' : '')}
          onClick={function () { setIsHighlight(!isHighlight); }}
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
        <button className="clear-button" onClick={handleClearCanvas} title="Clear All">
          🗑️
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
        {stickyNotes.map(function (note) {
          return (
            <div
              key={note.id}
              className="sticky-note"
              style={{
                left: note.x + 'px',
                top: note.y + 'px',
                backgroundColor: note.color,
              }}
            >
              <button
                className="sticky-note-close"
                onClick={function () { removeStickyNote(note.id); }}
              >
                ×
              </button>
              <textarea
                className="sticky-note-text"
                value={note.text}
                placeholder="Type note..."
                onChange={function (e) { updateStickyText(note.id, e.target.value); }}
              ></textarea>
            </div>
          );
        })}
        {textInputVisible && (
          <input
            type="text"
            className="canvas-text-input"
            style={{ left: textInputX + 'px', top: textInputY + 'px' }}
            value={textInputValue}
            autoFocus
            placeholder="Type text & press Enter"
            onChange={function (e) { setTextInputValue(e.target.value); }}
            onKeyDown={handleTextSubmit}
            onBlur={function () {
              if (textInputValue.trim() !== '') {
                var canvas = canvasRef.current;
                var ctx = canvas.getContext('2d');
                var fontSize = thickness * 4;
                ctx.font = buildFontString();
                ctx.globalAlpha = 1.0;
                if (isHighlight) {
                  var textWidth = ctx.measureText(textInputValue).width;
                  ctx.fillStyle = '#ffff00';
                  ctx.fillRect(textInputX - 2, textInputY - fontSize + 6, textWidth + 4, fontSize + 4);
                }
                ctx.fillStyle = drawColor;
                ctx.fillText(textInputValue, textInputX, textInputY + 16);
                saveCanvasToStorage();
                saveToHistory();
              }
              setTextInputVisible(false);
              setTextInputValue('');
            }}
          />
        )}
      </div>
    </div>
  );
}

export default Whiteboard;
