import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from "react";

const PALETTE_COLORS = ["#000000", "#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff"];

const DrawingCanvas = forwardRef(({ onSave, initialDrawing = null, compact = false, color: controlledColor, brushSize: controlledBrushSize, onColorChange, onBrushSizeChange }, ref) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [internalColor, setInternalColor] = useState("#000000");
  const [internalBrushSize, setInternalBrushSize] = useState(5);

  const color = compact && controlledColor != null ? controlledColor : internalColor;
  const brushSize = compact && controlledBrushSize != null ? controlledBrushSize : internalBrushSize;
  const setColorFn = compact && onColorChange ? onColorChange : setInternalColor;
  const setBrushSizeFn = compact && onBrushSizeChange
    ? (v) => onBrushSizeChange(typeof v === "number" ? v : parseInt(String(v), 10))
    : setInternalBrushSize;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    canvas.width = 800;
    canvas.height = 600;

    if (initialDrawing) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
      img.src = initialDrawing;
    } else {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, [initialDrawing]);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.strokeStyle = color;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const stopDrawing = () => {
    if (isDrawing) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      ctx.beginPath();
      setIsDrawing(false);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const saveDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataURL = canvas.toDataURL("image/png");
    if (onSave) {
      onSave(dataURL);
    }
  };

  useImperativeHandle(ref, () => ({
    clearCanvas,
    saveDrawing
  }), []);

  const toolbar = !compact && (
    <div style={{ marginBottom: "15px", display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
      <div>
        <label style={{ color: "var(--text-primary)", marginRight: "5px" }}>Color:</label>
        {PALETTE_COLORS.map((c) => (
          <button
            key={c}
            onClick={() => setColorFn(c)}
            style={{
              width: "30px",
              height: "30px",
              background: c,
              border: color === c ? "3px solid #f5ba13" : "1px solid #ddd",
              borderRadius: "4px",
              cursor: "pointer",
              marginRight: "5px"
            }}
          />
        ))}
        <input
          type="color"
          value={color}
          onChange={(e) => setColorFn(e.target.value)}
          style={{ width: "40px", height: "30px", cursor: "pointer" }}
        />
      </div>
      <div>
        <label style={{ color: "var(--text-primary)", marginRight: "5px" }}>Size:</label>
        <input
          type="range"
          min="1"
          max="20"
          value={brushSize}
          onChange={(e) => setBrushSizeFn(e.target.value)}
          style={{ width: "100px" }}
        />
        <span style={{ color: "var(--text-primary)", marginLeft: "5px" }}>{brushSize}px</span>
      </div>
      <button onClick={clearCanvas} style={{ padding: "6px 12px", background: "#999", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
        Clear
      </button>
      <button onClick={saveDrawing} style={{ padding: "6px 12px", background: "#4CAF50", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
        Save Drawing
      </button>
    </div>
  );

  return (
    <div style={{ padding: compact ? "8px" : "20px", background: "var(--bg-secondary)", borderRadius: "4px" }}>
      {toolbar}
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        style={{
          border: "2px solid var(--border-color)",
          borderRadius: "4px",
          cursor: "crosshair",
          background: "#ffffff",
          display: "block",
          maxWidth: "100%"
        }}
      />
    </div>
  );
});

DrawingCanvas.displayName = "DrawingCanvas";

export default DrawingCanvas;
