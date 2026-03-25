import { useState, useEffect, useRef } from "react";
import useWebSocket from "./hooks/useWebSocket";
import StatsCards from "./components/StatsCards";
import AlertList from "./components/AlertList";
import DetectionChart from "./components/DetectionChart";
import VideoOverlay from "./components/VideoOverlay";

// Mock data generator for development (replace with real API later)
function generateMockDetection() {
  const classes = ["bottle", "cup", "book", "laptop", "phone", "bag"];
  const zones = ["scan", "bag", "none"];
  return {
    id: Math.random().toString(36).substr(2, 9),
    timestamp: new Date().toISOString(),
    track_id: Math.floor(Math.random() * 20) + 1,
    object_class: classes[Math.floor(Math.random() * classes.length)],
    confidence: (Math.random() * 0.3 + 0.7).toFixed(2),
    zone: zones[Math.floor(Math.random() * zones.length)],
    bbox: [
      Math.floor(Math.random() * 400),
      Math.floor(Math.random() * 300),
      Math.floor(Math.random() * 150) + 80,
      Math.floor(Math.random() * 150) + 80,
    ],
    is_alert: Math.random() < 0.15,
  };
}

export default function App() {
  const [detections, setDetections] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [fps, setFps] = useState(0);
  const [fpsHistory, setFpsHistory] = useState(
    Array.from({ length: 30 }, (_, i) => ({ time: i, fps: 0 }))
  );
  const [detectionHistory, setDetectionHistory] = useState(
    Array.from({ length: 30 }, (_, i) => ({ time: i, count: 0 }))
  );
  const [connected, setConnected] = useState(false);
  const [useMock, setUseMock] = useState(true); // set false when backend is ready

  // WebSocket connection (connects to real backend when ready)
  const { lastMessage, isConnected } = useWebSocket(
    useMock ? null : "ws://localhost:8000/ws"
  );

  // Process real WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      try {
        const data = JSON.parse(lastMessage);
        handleNewDetection(data);
      } catch (e) {
        console.error("Failed to parse WS message", e);
      }
    }
  }, [lastMessage]);

  // Mock data simulation (remove when backend is ready)
  useEffect(() => {
    if (!useMock) return;
    setConnected(true);
    const interval = setInterval(() => {
      const detection = generateMockDetection();
      handleNewDetection(detection);
    }, 800);
    return () => clearInterval(interval);
  }, [useMock]);

  function handleNewDetection(detection) {
    setDetections((prev) => [detection, ...prev].slice(0, 50));

    if (detection.is_alert) {
      setAlerts((prev) =>
        [{ ...detection, review_status: "unreviewed" }, ...prev].slice(0, 20)
      );
    }

    const currentFps = Math.floor(Math.random() * 8) + 25;
    setFps(currentFps);

    setFpsHistory((prev) => {
      const next = [...prev.slice(1), { time: Date.now(), fps: currentFps }];
      return next;
    });

    setDetectionHistory((prev) => {
      const next = [...prev.slice(1), { time: Date.now(), count: prev[prev.length - 1].count + 1 }];
      return next;
    });
  }

  function handleReview(alertId, status) {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === alertId ? { ...a, review_status: status } : a
      )
    );
  }

  const accuracy = alerts.length > 0
    ? ((alerts.filter((a) => a.review_status === "confirmed").length / alerts.length) * 100).toFixed(1)
    : "N/A";

  return (
    <div className="min-h-screen bg-gray-950 text-white font-mono">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-red-500 rounded flex items-center justify-center text-sm font-bold">
            SCD
          </div>
          <h1 className="text-lg font-bold tracking-widest uppercase text-white">
            Smart Checkout Detector
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${connected || isConnected ? "bg-green-400 animate-pulse" : "bg-red-500"}`} />
          <span className="text-xs text-gray-400">
            {connected || isConnected ? "LIVE" : "DISCONNECTED"}
          </span>
          {useMock && (
            <span className="ml-2 text-xs bg-yellow-900 text-yellow-300 px-2 py-0.5 rounded">
              MOCK DATA
            </span>
          )}
        </div>
      </header>

      <main className="p-6 space-y-6">
        {/* Stats Row */}
        <StatsCards
          detectionCount={detections.length}
          alertCount={alerts.length}
          fps={fps}
          accuracy={accuracy}
        />

        {/* Main content grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Video + Chart column */}
          <div className="xl:col-span-2 space-y-6">
            <VideoOverlay detections={detections.slice(0, 5)} />
            <DetectionChart fpsHistory={fpsHistory} detectionHistory={detectionHistory} />
          </div>

          {/* Alert list column */}
          <div className="xl:col-span-1">
            <AlertList alerts={alerts} onReview={handleReview} />
          </div>
        </div>
      </main>
    </div>
  );
}