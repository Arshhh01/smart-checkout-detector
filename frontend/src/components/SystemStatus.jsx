import { useState, useEffect } from "react";

export default function SystemStatus({ isConnected, fps, detectionCount }) {
  const [uptime, setUptime] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      setUptime(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const mins = Math.floor(uptime / 60);
  const secs = uptime % 60;

  const status = isConnected && fps > 0 ? "operational" : isConnected ? "connected" : "offline";
  const statusColor = status === "operational" ? "text-accent-green" : status === "connected" ? "text-accent-yellow" : "text-accent-red";
  const dotColor = status === "operational" ? "bg-accent-green" : status === "connected" ? "bg-accent-yellow" : "bg-accent-red";

  return (
    <div className="bg-surface-1 border border-line rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-line">
        <span className="text-sm text-txt-secondary font-medium">System status</span>
      </div>
      <div className="px-4 py-3 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-txt-secondary">Status</span>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${dotColor} ${status === "operational" ? "animate-pulse" : ""}`} />
            <span className={`text-sm font-medium capitalize ${statusColor}`}>{status}</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-txt-secondary">Uptime</span>
          <span className="text-sm font-mono text-white">{mins}m {secs.toString().padStart(2, "0")}s</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-txt-secondary">Camera</span>
          <span className="text-sm font-mono text-white">cam_0 · 1920x1080</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-txt-secondary">Backend</span>
          <span className="text-sm font-mono text-white">Render</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-txt-secondary">Model</span>
          <span className="text-sm font-mono text-white">YOLOv8n</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-txt-secondary">Frames processed</span>
          <span className="text-sm font-mono text-white">{detectionCount}</span>
        </div>
      </div>
    </div>
  );
}
