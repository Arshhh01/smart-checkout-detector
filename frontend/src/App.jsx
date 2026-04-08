import { useState, useEffect, useRef, useCallback } from "react";
import useWebSocket from "./hooks/useWebSocket";
import StatsCards from "./components/StatsCards";
import AlertList from "./components/AlertList";
import DetectionChart from "./components/DetectionChart";
import VideoOverlay from "./components/VideoOverlay";
import TheftAlertPanel from "./components/TheftAlertPanel";
import ClearedItemsPanel from "./components/ClearedItemsPanel";
import POSPanel from "./components/POSPanel";
import SessionSummary from "./components/SessionSummary";

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
  const [alerts, setAlerts] = useState([]);
  const [activeThefts, setActiveThefts] = useState([]);
  const [clearedItems, setClearedItems] = useState([]);
  const [fps, setFps] = useState(0);
  const [fpsHistory, setFpsHistory] = useState(
    Array.from({ length: 30 }, (_, i) => ({ time: i, fps: 0 }))
  );
  const [detectionHistory, setDetectionHistory] = useState(
    Array.from({ length: 30 }, (_, i) => ({ time: i, count: 0 }))
  );
  const [refreshing, setRefreshing] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  // Unique object tracking — count distinct track_ids, not WS messages
  const trackedIdsRef = useRef(new Set());
  const [uniqueObjectCount, setUniqueObjectCount] = useState(0);

  // Frame counter for charts
  const frameCountRef = useRef(0);

  const theftTimersRef = useRef({});
  const sessionStartRef = useRef(Date.now());

  // Track which track_ids already have an alert to prevent duplicates
  const alertedTrackIdsRef = useRef(new Set());

  const { lastMessage, isConnected } = useWebSocket(WS_URL);

  // Session reset — clears all state for a fresh demo
  const resetSession = useCallback(() => {
    setAlerts([]);
    setActiveThefts([]);
    setClearedItems([]);
    setFps(0);
    setFpsHistory(Array.from({ length: 30 }, (_, i) => ({ time: i, fps: 0 })));
    setDetectionHistory(Array.from({ length: 30 }, (_, i) => ({ time: i, count: 0 })));
    trackedIdsRef.current = new Set();
    setUniqueObjectCount(0);
    frameCountRef.current = 0;
    alertedTrackIdsRef.current = new Set();
    sessionStartRef.current = Date.now();
    Object.values(theftTimersRef.current).forEach(clearTimeout);
    theftTimersRef.current = {};
  }, []);

  function fetchAlerts() {
    setRefreshing(true);
    fetch(`${API_URL}/alerts/?limit=50`, {
      headers: { "X-API-Key": API_KEY },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const sessionStartTime = new Date(sessionStartRef.current);
          const mapped = data
            .filter((a) => new Date(a.created_at || a.timestamp) >= sessionStartTime)
            .map((a) => ({
              id: String(a.id),
              timestamp: parseTimestamp(a.created_at || a.timestamp),
              object_class: parseObjectClass(a.reason || a.alert_reason),
              confidence: a.confidence ?? 0.9,
              track_id: a.id ?? 0,
              zone: "bag",
              bbox: a.bbox ?? [0, 0, 50, 50],
              is_alert: true,
              alert_reason: a.reason || a.alert_reason,
              severity: "medium",
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
      if (parsed.type === "ping" || parsed.type === "connected") return;

      const data = (parsed.type === "detection" || parsed.type === "alert")
        ? parsed.data
        : parsed;
      if (!data) return;

      setCurrentFrame(data);

      // Count unique objects tracked (not WS messages)
      if (data.objects && data.objects.length > 0) {
        let changed = false;
        for (const obj of data.objects) {
          if (obj.track_id != null && !trackedIdsRef.current.has(obj.track_id)) {
            trackedIdsRef.current.add(obj.track_id);
            changed = true;
          }
        }
        if (changed) setUniqueObjectCount(trackedIdsRef.current.size);
      }

      frameCountRef.current += 1;

      // Track cleared items (scanned before bagging)
      if (data.scanned_items && data.scanned_items.length > 0) {
        setClearedItems((prev) => {
          const updated = [...prev];
          for (const item of data.scanned_items) {
            const existingIdx = updated.findIndex((c) => c.track_id === item.track_id);
            if (existingIdx === -1) {
              updated.unshift({
                id: `cleared-${item.track_id}`,
                object_class: item["class"],
                track_id: item.track_id,
                confidence: item.confidence,
                timestamp: new Date().toISOString(),
              });
            }
          }
          return updated.slice(0, 20);
        });
      }

      // Handle theft alerts — DEDUPLICATED by track_id
      if (data.is_alert && data.alert_reason) {
        const objClass = parseObjectClass(data.alert_reason);
        const trackId = data.objects?.[0]?.track_id ?? 0;
        const theftId = `theft-${trackId}`;
        const newSeverity = data.severity || "low";
        const newDwell = data.dwell_count || 3;
        const newConfidence = data.objects?.[0]?.confidence ?? 0.9;

        // Update or create active theft — escalate severity if higher
        setActiveThefts((prev) => {
          const existing = prev.find((t) => t.id === theftId);
          if (existing) {
            const sevOrder = { low: 0, medium: 1, high: 2 };
            const shouldUpdate =
              (sevOrder[newSeverity] || 0) > (sevOrder[existing.severity] || 0) ||
              newDwell > existing.dwellFrames ||
              newConfidence > existing.confidence;
            if (shouldUpdate) {
              return prev.map((t) =>
                t.id === theftId
                  ? {
                      ...t,
                      severity: (sevOrder[newSeverity] || 0) >= (sevOrder[t.severity] || 0) ? newSeverity : t.severity,
                      dwellFrames: Math.max(t.dwellFrames, newDwell),
                      confidence: Math.max(t.confidence, newConfidence),
                    }
                  : t
              );
            }
            return prev;
          }
          return [
            {
              id: theftId,
              object_class: objClass,
              track_id: trackId,
              confidence: newConfidence,
              timestamp: parseTimestamp(data.timestamp),
              alert_reason: data.alert_reason,
              severity: newSeverity,
              dwellFrames: newDwell,
            },
            ...prev,
          ].slice(0, 5);
        });

        // ONE alert history entry per track_id — update severity if escalated
        if (!alertedTrackIdsRef.current.has(trackId)) {
          alertedTrackIdsRef.current.add(trackId);
          setAlerts((prev) => [
            {
              id: `live-${trackId}-${Date.now()}`,
              timestamp: parseTimestamp(data.timestamp),
              object_class: objClass,
              confidence: newConfidence,
              track_id: trackId,
              zone: "bag",
              bbox: data.objects?.[0]?.bbox ?? [0, 0, 50, 50],
              is_alert: true,
              alert_reason: data.alert_reason,
              severity: newSeverity,
              review_status: "unreviewed",
            },
            ...prev,
          ].slice(0, 100));
        } else {
          // Escalate existing alert severity
          setAlerts((prev) =>
            prev.map((a) => {
              if (a.track_id === trackId && a.review_status === "unreviewed") {
                const sevOrder = { low: 0, medium: 1, high: 2 };
                if ((sevOrder[newSeverity] || 0) > (sevOrder[a.severity] || 0)) {
                  return { ...a, severity: newSeverity, confidence: Math.max(a.confidence, newConfidence) };
                }
              }
              return a;
            })
          );
        }

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
        { time: Date.now(), count: uniqueObjectCount },
      ]);
    } catch (e) {
      console.error("Failed to parse WS message", e);
    }
  }, [lastMessage, uniqueObjectCount]);

  function handleTheftAccept(theftId) {
    const theft = activeThefts.find((t) => t.id === theftId);
    setActiveThefts((prev) => prev.filter((t) => t.id !== theftId));
    if (!theft) return;
    setAlerts((prev) =>
      prev.map((a) => {
        if (a.track_id === theft.track_id) {
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
        if (a.track_id === theft.track_id) {
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
            onClick={resetSession}
            className="text-xs px-3 py-1 rounded border border-gray-700 text-gray-400 hover:border-green-500 hover:text-green-400 transition-colors"
          >
            New Session
          </button>
          <button
            onClick={() => setShowSummary(true)}
            className="text-xs px-3 py-1 rounded border border-yellow-700 text-yellow-400 hover:bg-yellow-900/30 transition-colors"
          >
            End Shift
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
          detectionCount={uniqueObjectCount}
          alertCount={alerts.length}
          unreviewedCount={unreviewed}
          fps={fps}
          accuracy={accuracy}
        />

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-1 space-y-4">
            <div>
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
            <div>
              <div className="text-xs text-gray-500 tracking-widest uppercase mb-2 px-1">
                Cleared Items
              </div>
              <ClearedItemsPanel clearedItems={clearedItems} />
            </div>
            <div>
              <div className="text-xs text-gray-500 tracking-widest uppercase mb-2 px-1">
                Point of Sale
              </div>
              <POSPanel clearedItems={clearedItems} activeThefts={activeThefts} />
            </div>
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

      {showSummary && (
        <SessionSummary
          alerts={alerts}
          clearedItems={clearedItems}
          detectionCount={uniqueObjectCount}
          sessionStart={sessionStartRef.current}
          onClose={() => setShowSummary(false)}
        />
      )}
    </div>
  );
}