import { useEffect, useRef } from "react";

const SCALE_X = 560 / 1920;
const SCALE_Y = 320 / 1080;

function scaleZone(points) {
  return points.map(([x, y]) => [x * SCALE_X, y * SCALE_Y]);
}

const SCAN_ZONE_SCALED = scaleZone([[45, 120], [870, 120], [870, 975], [45, 975]]);
const BAG_ZONE_SCALED  = scaleZone([[930, 120], [1875, 120], [1875, 975], [930, 975]]);

function drawPolygon(ctx, points, strokeColor, fillColor, label) {
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  points.slice(1).forEach(([x, y]) => ctx.lineTo(x, y));
  ctx.closePath();
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([8, 4]);
  ctx.fillStyle = fillColor;
  ctx.fill();
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = strokeColor;
  ctx.font = "500 11px 'DM Sans', sans-serif";
  ctx.fillText(label, points[0][0] + 6, points[0][1] + 16);
}

export default function VideoOverlay({ currentFrame, isConnected }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const streamRef = useRef(null);
  const frameRef = useRef(currentFrame);

  useEffect(() => { frameRef.current = currentFrame; }, [currentFrame]);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: { width: 1920, height: 1080 } })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
      })
      .catch((err) => console.warn("Camera not available:", err));
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext("2d");

    function draw() {
      animRef.current = requestAnimationFrame(draw);
      if (video.readyState >= 2) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      } else {
        ctx.fillStyle = "#111";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      drawPolygon(ctx, SCAN_ZONE_SCALED, "rgba(59,130,246,0.8)", "rgba(59,130,246,0.05)", "Scan zone");
      drawPolygon(ctx, BAG_ZONE_SCALED,  "rgba(234,179,8,0.8)", "rgba(234,179,8,0.05)", "Bag zone");

      const frame = frameRef.current;
      if (frame && frame.objects) {
        frame.objects.forEach((obj) => {
          if (!obj.bbox || obj.bbox.length < 4) return;
          const [x1, y1, x2, y2] = obj.bbox;
          const cx1 = x1 * SCALE_X, cy1 = y1 * SCALE_Y;
          const cw = (x2 - x1) * SCALE_X, ch = (y2 - y1) * SCALE_Y;

          const inBag = (frame.bag_zone_items ?? []).includes(obj.track_id);
          const inScan = (frame.scan_zone_items ?? []).includes(obj.track_id);
          const isAlert = frame.is_alert && inBag;

          const boxColor = isAlert ? "#ef4444" : inBag ? "#eab308" : inScan ? "#22c55e" : "#666";

          ctx.strokeStyle = boxColor;
          ctx.lineWidth = 2;
          ctx.setLineDash([]);
          ctx.strokeRect(cx1, cy1, cw, ch);

          const label = `${obj.class} ${(obj.confidence * 100).toFixed(0)}%`;
          ctx.font = "600 10px 'DM Sans', sans-serif";
          const lw = ctx.measureText(label).width + 8;
          ctx.fillStyle = boxColor;
          ctx.globalAlpha = 0.9;
          ctx.fillRect(cx1, cy1 - 16, lw, 16);
          ctx.globalAlpha = 1;
          ctx.fillStyle = "#fff";
          ctx.fillText(label, cx1 + 4, cy1 - 4);

          if (isAlert) {
            ctx.fillStyle = "rgba(239,68,68,0.12)";
            ctx.fillRect(cx1, cy1, cw, ch);
          }
        });
      }

      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.font = "10px 'JetBrains Mono', monospace";
      ctx.fillText(new Date().toLocaleTimeString(), 8, canvas.height - 8);
    }

    draw();
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []);

  const objCount = currentFrame?.objects?.length ?? 0;

  return (
    <div className="bg-surface-1 border border-line rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5">
        <span className="text-sm text-txt-secondary font-medium">Live feed</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-txt-secondary font-mono">
            {objCount > 0 ? `${objCount} object${objCount > 1 ? "s" : ""}` : "\u2014"}
          </span>
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-accent-red animate-pulse" : "bg-txt-muted"}`} />
            <span className="text-sm text-txt-secondary">{isConnected ? "Rec" : "Off"}</span>
          </div>
        </div>
      </div>

      <video ref={videoRef} className="hidden" muted playsInline />
      <canvas ref={canvasRef} width={560} height={320} className="w-full" />

      <div className="px-4 py-2 flex gap-5 text-sm text-txt-secondary">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block" /> Scan</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-yellow-500 inline-block" /> Bag</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-green-500 inline-block" /> Cleared</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-red-500 inline-block" /> Alert</span>
      </div>
    </div>
  );
}