import { useEffect, useRef } from "react";

export default function VideoOverlay({ detections }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw dark background (simulating video feed)
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw zone polygons
    // Scan zone (left area)
    ctx.strokeStyle = "rgba(59, 130, 246, 0.6)";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 3]);
    ctx.strokeRect(30, 30, 220, 260);
    ctx.fillStyle = "rgba(59, 130, 246, 0.05)";
    ctx.fillRect(30, 30, 220, 260);
    ctx.fillStyle = "rgba(59, 130, 246, 0.8)";
    ctx.font = "11px monospace";
    ctx.fillText("SCAN ZONE", 38, 48);

    // Bag zone (right area)
    ctx.strokeStyle = "rgba(234, 179, 8, 0.6)";
    ctx.setLineDash([6, 3]);
    ctx.strokeRect(300, 30, 220, 260);
    ctx.fillStyle = "rgba(234, 179, 8, 0.05)";
    ctx.fillRect(300, 30, 220, 260);
    ctx.fillStyle = "rgba(234, 179, 8, 0.8)";
    ctx.fillText("BAG ZONE", 308, 48);

    ctx.setLineDash([]);

    // Draw bounding boxes for detections
    detections.forEach((det) => {
      const [x, y, w, h] = det.bbox;
      const isAlert = det.is_alert;

      // Box color based on alert status
      const boxColor = isAlert ? "#ef4444" : "#22c55e";
      const bgColor = isAlert ? "rgba(239, 68, 68, 0.1)" : "rgba(34, 197, 94, 0.1)";

      // Draw box fill
      ctx.fillStyle = bgColor;
      ctx.fillRect(x, y, w, h);

      // Draw box border
      ctx.strokeStyle = boxColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);

      // Draw label background
      const label = `${det.object_class} ${(det.confidence * 100).toFixed(0)}%`;
      ctx.font = "bold 11px monospace";
      const labelWidth = ctx.measureText(label).width + 8;
      ctx.fillStyle = boxColor;
      ctx.fillRect(x, y - 18, labelWidth, 18);

      // Draw label text
      ctx.fillStyle = "#fff";
      ctx.fillText(label, x + 4, y - 4);

      // Draw alert indicator
      if (isAlert) {
        ctx.fillStyle = "#ef4444";
        ctx.font = "bold 11px monospace";
        ctx.fillText("⚠ ALERT", x + 4, y + h - 6);
      }
    });

    // Draw grid overlay for visual effect
    ctx.strokeStyle = "rgba(255,255,255,0.03)";
    ctx.lineWidth = 1;
    for (let gx = 0; gx < canvas.width; gx += 40) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, canvas.height);
      ctx.stroke();
    }
    for (let gy = 0; gy < canvas.height; gy += 40) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(canvas.width, gy);
      ctx.stroke();
    }

    // Timestamp
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "10px monospace";
    ctx.fillText(new Date().toLocaleTimeString(), 8, canvas.height - 8);

  }, [detections]);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800">
        <span className="text-xs text-gray-400 tracking-widest uppercase">Live Feed</span>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs text-red-400">REC</span>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        width={560}
        height={320}
        className="w-full"
        style={{ imageRendering: "pixelated" }}
      />
      <div className="px-4 py-2 border-t border-gray-800 flex gap-4 text-xs text-gray-500">
        <span>🟦 Scan Zone</span>
        <span>🟨 Bag Zone</span>
        <span>🟩 Normal Detection</span>
        <span>🟥 Alert</span>
      </div>
    </div>
  );
}