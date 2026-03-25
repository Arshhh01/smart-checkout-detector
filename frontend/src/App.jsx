import { useState, useEffect, useRef } from "react";
import useWebSocket from "./hooks/useWebSocket";
import StatsCards from "./components/StatsCards";
import AlertList from "./components/AlertList";
import DetectionChart from "./components/DetectionChart";
import VideoOverlay from "./components/VideoOverlay";
import TheftAlertPanel from "./components/TheftAlertPanel";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const API_KEY = import.meta.env.VITE_API_KEY || "Godofwar12";
const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8000/ws/";

function parseObjectClass(alert_reason) {
  if (!alert_reason) return "unknown";
  if (alert_reason.includes(":")) {
    return alert_reason.split(":").slice(1).join(":").trim();
  }
  return alert_reason;
}

function parseTimestamp(ts) {
  if (!ts) return new Date().toISOString();
  if (typeof ts === "number") return new Date(ts * 1000).toISOString();
  const d = new Date(ts);
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

export default function App() {
  const [currentFrame, setCurrentFrame] = useState(null);
  const [detectionCount, setDetectionCount] = useState(0);
  const [alerts, setAlerts] = useState([]);
  const [activeThefts, setActiveThefts] = useState([]);
  const [fps, setFps] = useState(0);
  const [fpsHistory, setFpsHistory] = useState(
    Array.from({ length: 30 }, (_, i) => ({ time: i, fps: 0 }))
  );
  const [detectionHistory, setDetectionHistory] = useState(
    Array.from({ length: 30 }, (_, i) => ({ time: i, count: 0 }))
  );
  const [refreshing, setRefreshing] = useState(false);
  const detectionCountRef = useRef(0);
  const theftTimersRef = useRef({});

  const { lastMessage, isConnected } = useWebSocket(WS_URL);

  function fetchAlerts() {
    setRefreshing(true);
    fetch(`${API_URL}/alerts/?limit=50`, {
      headers: { "X-API-Key": API_KEY },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const mapped = data.map((a) => ({
            id: String(a.id),
            timestamp: parseTimestamp(a.created_at || a.timestamp),
            object_class: parseObjectClass(a.reason || a.alert_reason),
            confidence: a.confidence ?? 0.9,
            track_id: a.id ?? 0,
            zone: "bag",
            bbox: a.bbox ?? [0, 0, 50, 50],
            is_alert: true,
            alert_reason: a.reason || a.alert_reason,
            review_status: a.reviewed ? (a.review_outcome ?? "confirmed") : "unreviewed",
          }));
          setAlerts(mapped);
        }
      })
      .catch((err) => console.error("Failed to fetch alerts:", err))
      .finally(() => setRefreshing(false));
  }

  useEffect(() => {
    fetchAlerts();
  }, []);

  useEffect(() => {
    if (!lastMessage) return;
    try {
      const parsed = JSON.parse(lastMessage);

      // DEBUG — log every WS message
      console.log("WS RAW:", JSON.stringify(parsed).slice(0, 400));

      if (parsed.type === "ping" || parsed.type === "connected") return;

      const data = (parsed.type === "detection" || parsed.type === "alert")
        ? parsed.data
        : parsed;
      if (!data) return;

      // DEBUG — log unwrapped data
      console.log("WS DATA:", JSON.stringify(data).slice(0, 400));
      console.log("is_alert:", data.is_alert, "alert_reason:", data.alert_reason);

      // Update current frame for VideoOverlay
      setCurrentFrame(data);

      // Update detection count
      detectionCountRef.current += 1;
      setDetectionCount(detectionCountRef.current);

      // Handle live theft alerts
      if (data.is_alert && data.alert_reason) {
        console.log("THEFT DETECTED:", data.alert_reason);
        const objClass = parseObjectClass(data.alert_reason);
        const trackId = data.objects?.[0]?.track_id ?? 0;
        const theftId = `theft-${trackId}-${data.alert_reason}`;

        setActiveThefts((prev) => {
          if (prev.find((t) => t.id === theftId)) return prev;
          return [
            {
              id: theftId,
              object_class: objClass,
              track_id: trackId,
              confidence: data.objects?.[0]?.confidence ?? 0.9,
              timestamp: parseTimestamp(data.timestamp),
              alert_reason: data.alert_reason,
              dwellFrames: "8+",
            },
            ...prev,
          ].slice(0, 5);
        });

        setAlerts((prev) => {
          const exists = prev.find(
            (a) =>
              a.alert_reason === data.alert_reason &&
              Math.abs(new Date(a.timestamp) - new Date(parseTimestamp(data.timestamp))) < 2000
          );
          if (exists) return prev;
          return [
            {
              id: `live-${Date.now()}`,
              timestamp: parseTimestamp(data.timestamp),
              object_class: objClass,
              confidence: data.objects?.[0]?.confidence ?? 0.9,
              track_id: trackId,
              zone: "bag",
              bbox: data.objects?.[0]?.bbox ?? [0, 0, 50, 50],
              is_alert: true,
              alert_reason: data.alert_reason,
              review_status: "unreviewed",
            },
            ...prev,
          ].slice(0, 100);
        });

        if (theftTimersRef.current[theftId]) clearTimeout(theftTimersRef.current[theftId]);
        theftTimersRef.current[theftId] = setTimeout(() => {
          setActiveThefts((prev) => prev.filter((t) => t.id !== theftId));
        }, 30000);
      }

      const currentFps = data.fps ?? 0;
      setFps(currentFps);
      setFpsHistory((prev) => [...prev.slice(1), { time: Date.now(), fps: currentFps }]);
      setDetectionHistory((prev) => [
        ...prev.slice(1),
        { time: Date.now(), count: detectionCountRef.current % 50 },
      ]);
    } catch (e) {
      console.error("Failed to parse WS message", e);
    }
  }, [lastMessage]);

  function handleTheftAccept(theftId) {
    const theft = activeThefts.find((t) => t.id === theftId);
    setActiveThefts((prev) => prev.filter((t) => t.id !== theftId));
    if (!theft) return;
    // Match by track_id AND close timestamp — not alert_reason (which is the same for all items of the same class)
    setAlerts((prev) =>
      prev.map((a) => {
        if (a.track_id === theft.track_id && Math.abs(new Date(a.timestamp) - new Date(theft.timestamp)) < 10000) {
          // Also fire the PATCH to persist the review on the backend
          if (typeof a.id === "number" || (typeof a.id === "string" && !a.id.startsWith("live-"))) {
            handleReview(a.id, "confirmed");
          }
          return { ...a, review_status: "confirmed" };
        }
        return a;
      })
    );
  }

  function handleTheftReject(theftId) {
    const theft = activeThefts.find((t) => t.id === theftId);
    setActiveThefts((prev) => prev.filter((t) => t.id !== theftId));
    if (!theft) return;
    setAlerts((prev) =>
      prev.map((a) => {
        if (a.track_id === theft.track_id && Math.abs(new Date(a.timestamp) - new Date(theft.timestamp)) < 10000) {
          if (typeof a.id === "number" || (typeof a.id === "string" && !a.id.startsWith("live-"))) {
            handleReview(a.id, "false-positive");
          }
          return { ...a, review_status: "false-positive" };
        }
        return a;
      })
    );
  }

  function handleTheftDismiss(theftId) {
    setActiveThefts((prev) => prev.filter((t) => t.id !== theftId));
    if (theftTimersRef.current[theftId]) clearTimeout(theftTimersRef.current[theftId]);
  }

  function handleReview(alertId, status) {
    // Backend AlertReview schema expects: { outcome: "...", reviewed_by: "..." }
    fetch(`${API_URL}/alerts/${alertId}/review`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": API_KEY,
      },
      body: JSON.stringify({
        outcome: status === "confirmed" ? "confirmed_theft" : status === "false-positive" ? "false_positive" : status,
        reviewed_by: "dashboard_user",
      }),
    }).catch((err) => console.error("Failed to review alert:", err));

    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, review_status: status } : a))
    );
  }

  const confirmedAlerts = alerts.filter((a) => a.review_status === "confirmed").length;
  const accuracy =
    alerts.length > 0 ? ((confirmedAlerts / alerts.length) * 100).toFixed(1) : "N/A";
  const unreviewed = alerts.filter((a) => a.review_status === "unreviewed").length;
  const hasActiveTheft = activeThefts.length > 0;

  return (
    <div className="min-h-screen bg-gray-950 text-white font-mono">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-red-500 rounded flex items-center justify-center text-sm font-bold">
            SCD
          </div>
          <h1 className="text-lg font-bold tracking-widest uppercase text-white">
            Smart Checkout Detector
          </h1>
        </div>
        <div className="flex items-center gap-4">
          {hasActiveTheft && (
            <span className="text-xs bg-red-600 text-white px-3 py-1 rounded-full animate-pulse font-bold">
              {activeThefts.length} THEFT ALERT{activeThefts.length > 1 ? "S" : ""}
            </span>
          )}
          <button
            onClick={fetchAlerts}
            disabled={refreshing}
            className="text-xs px-3 py-1 rounded border border-gray-700 text-gray-400 hover:border-blue-500 hover:text-blue-400 transition-colors disabled:opacity-40"
          >
            {refreshing ? "Refreshing..." : "Refresh Alerts"}
          </button>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-400 animate-pulse" : "bg-red-500"}`} />
            <span className="text-xs text-gray-400">
              {isConnected ? "LIVE" : "DISCONNECTED"}
            </span>
          </div>
        </div>
      </header>

      <main className="p-6 space-y-6">
        <StatsCards
          detectionCount={detectionCount}
          alertCount={alerts.length}
          unreviewedCount={unreviewed}
          fps={fps}
          accuracy={accuracy}
        />

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-1">
            <div className="text-xs text-gray-500 tracking-widest uppercase mb-2 px-1">
              Active Theft Alerts
            </div>
            <TheftAlertPanel
              activeThefts={activeThefts}
              onAccept={handleTheftAccept}
              onReject={handleTheftReject}
              onDismiss={handleTheftDismiss}
            />
          </div>

          <div className="xl:col-span-2 space-y-6">
            <VideoOverlay currentFrame={currentFrame} isConnected={isConnected} />
            <DetectionChart fpsHistory={fpsHistory} detectionHistory={detectionHistory} />
          </div>

          <div className="xl:col-span-1">
            <div className="text-xs text-gray-500 tracking-widest uppercase mb-2 px-1">
              Alert History
            </div>
            <AlertList alerts={alerts} onReview={handleReview} />
          </div>
        </div>
      </main>
    </div>
  );
}