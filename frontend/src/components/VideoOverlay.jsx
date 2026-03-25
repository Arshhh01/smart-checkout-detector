import { useEffect, useRef } from "react";

const SCALE_X = 560 / 1280;
const SCALE_Y = 320 / 720;

function scaleZone(points) {
  return points.map(([x, y]) => [x * SCALE_X, y * SCALE_Y]);
}

const SCAN_ZONE_SCALED = scaleZone([[50, 150], [500, 150], [500, 600], [50, 600]]);
const BAG_ZONE_SCALED  = scaleZone([[550, 100], [1200, 100], [1200, 650], [550, 650]]);

function drawPolygon(ctx, points, strokeColor, fillColor, label) {
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  points.slice(1).forEach(([x, y]) => ctx.lineTo(x, y));
  ctx.closePath();
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 3]);
  ctx.fillStyle = fillColor;
  ctx.fill();
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = strokeColor;
  ctx.font = "bold 11px monospace";
  ctx.fillText(label, points[0][0] + 6, points[0][1] + 16);
}

export default function VideoOverlay({ currentFrame, isConnected }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const streamRef = useRef(null);
  const frameRef = useRef(currentFrame);

  // Keep frameRef in sync without restarting the draw loop
  useEffect(() => {
    frameRef.current = currentFrame;
  }, [currentFrame]);

  // Start webcam once
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: { width: 1280, height: 720 } })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      })
      .catch((err) => console.warn("Camera not available:", err));

    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  // Draw loop — runs continuously, reads latest frame from ref
  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext("2d");

    function draw() {
      animRef.current = requestAnimationFrame(draw);

      // Draw video
      if (video.readyState >= 2) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      } else {
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Draw zones
      drawPolygon(ctx, SCAN_ZONE_SCALED, "rgba(59,130,246,0.9)", "rgba(59,130,246,0.06)", "SCAN ZONE");
      drawPolygon(ctx, BAG_ZONE_SCALED,  "rgba(234,179,8,0.9)",  "rgba(234,179,8,0.05)",  "BAG ZONE");

      // Draw grid
      ctx.strokeStyle = "rgba(255,255,255,0.03)";
      ctx.lineWidth = 1;
      for (let gx = 0; gx < canvas.width; gx += 40) {
        ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, canvas.height); ctx.stroke();
      }
      for (let gy = 0; gy < canvas.height; gy += 40) {
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(canvas.width, gy); ctx.stroke();
      }

      // Draw ONLY current frame's detections
      const frame = frameRef.current;
      if (frame && frame.objects) {
        frame.objects.forEach((obj) => {
          if (!obj.bbox || obj.bbox.length < 4) return;
          const [x1, y1, x2, y2] = obj.bbox;
          const cx1 = x1 * SCALE_X;
          const cy1 = y1 * SCALE_Y;
          const cw  = (x2 - x1) * SCALE_X;
          const ch  = (y2 - y1) * SCALE_Y;

          const inBag  = (frame.bag_zone_items  ?? []).includes(obj.track_id);
          const inScan = (frame.scan_zone_items ?? []).includes(obj.track_id);
          const isAlert = frame.is_alert && inBag;

          const boxColor = isAlert ? "#ef4444" : inBag ? "#f59e0b" : inScan ? "#22c55e" : "#6b7280";
          const bgColor  = isAlert ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.05)";

          ctx.fillStyle = bgColor;
          ctx.fillRect(cx1, cy1, cw, ch);
          ctx.strokeStyle = boxColor;
          ctx.lineWidth = 2;
          ctx.setLineDash([]);
          ctx.strokeRect(cx1, cy1, cw, ch);

          const label = `${obj.class} ${(obj.confidence * 100).toFixed(0)}%`;
          ctx.font = "bold 10px monospace";
          const lw = ctx.measureText(label).width + 8;
          ctx.fillStyle = boxColor;
          ctx.fillRect(cx1, cy1 - 16, lw, 16);
          ctx.fillStyle = "#fff";
          ctx.fillText(label, cx1 + 4, cy1 - 3);

          if (isAlert) {
            ctx.fillStyle = "#ef4444";
            ctx.font = "bold 10px monospace";
            ctx.fillText("ALERT", cx1 + 4, cy1 + ch - 4);
          }
        });
      }

      // Timestamp
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.font = "10px monospace";
      ctx.fillText(new Date().toLocaleTimeString(), 8, canvas.height - 8);
    }

    draw();
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []);

  const objCount = currentFrame?.objects?.length ?? 0;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800">
        <span className="text-xs text-gray-400 tracking-widest uppercase">Live Feed</span>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">
            {objCount > 0 ? `${objCount} object${objCount > 1 ? "s" : ""}` : "No detections"}
          </span>
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-red-500 animate-pulse" : "bg-gray-600"}`} />
            <span className={`text-xs ${isConnected ? "text-red-400" : "text-gray-500"}`}>
              {isConnected ? "REC" : "OFFLINE"}
            </span>
          </div>
        </div>
      </div>

      <video ref={videoRef} className="hidden" muted playsInline />
      <canvas ref={canvasRef} width={560} height={320} className="w-full" />

      <div className="px-4 py-2 border-t border-gray-800 flex gap-4 text-xs text-gray-500">
        <span>🟦 Scan Zone</span>
        <span>🟨 Bag Zone</span>
        <span>🟩 Scanned</span>
        <span>🟥 Alert</span>
      </div>
    </div>
  );
}