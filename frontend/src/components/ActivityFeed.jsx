import { useState, useEffect, useRef } from "react";

export default function ActivityFeed({ currentFrame }) {
  const [events, setEvents] = useState([]);
  const seenRef = useRef(new Map()); // track_id -> last zone

  useEffect(() => {
    if (!currentFrame || !currentFrame.objects) return;

    const scanIds = new Set(currentFrame.scan_zone_items || []);
    const bagIds = new Set(currentFrame.bag_zone_items || []);
    const isAlert = currentFrame.is_alert;

    for (const obj of currentFrame.objects) {
      const tid = obj.track_id;
      if (tid == null) continue;

      const inScan = scanIds.has(tid);
      const inBag = bagIds.has(tid);
      const prevZone = seenRef.current.get(tid);

      let newEvent = null;

      if (inScan && prevZone !== "scan") {
        seenRef.current.set(tid, "scan");
        newEvent = {
          id: `${tid}-scan-${Date.now()}`,
          text: `${obj.class} #${tid} entered scan zone`,
          type: "scan",
          time: new Date(),
        };
      } else if (inBag && prevZone !== "bag") {
        seenRef.current.set(tid, "bag");
        const wasScan = prevZone === "scan";
        newEvent = {
          id: `${tid}-bag-${Date.now()}`,
          text: wasScan
            ? `${obj.class} #${tid} moved to bag zone (cleared)`
            : `${obj.class} #${tid} entered bag zone (no scan)`,
          type: wasScan ? "cleared" : "warning",
          time: new Date(),
        };
      }

      if (isAlert && inBag && prevZone === "bag") {
        // Only add alert event once
        const lastEvent = events[0];
        if (!lastEvent || !lastEvent.id.startsWith(`${tid}-alert`)) {
          newEvent = {
            id: `${tid}-alert-${Date.now()}`,
            text: `Theft alert: ${obj.class} #${tid}`,
            type: "alert",
            time: new Date(),
          };
        }
      }

      if (newEvent) {
        setEvents((prev) => [newEvent, ...prev].slice(0, 15));
      }
    }
  }, [currentFrame]);

  const typeStyles = {
    scan: "text-blue-400",
    cleared: "text-accent-green",
    warning: "text-accent-yellow",
    alert: "text-accent-red",
  };

  const typeDot = {
    scan: "bg-blue-400",
    cleared: "bg-accent-green",
    warning: "bg-accent-yellow",
    alert: "bg-accent-red",
  };

  return (
    <div className="bg-surface-1 border border-line rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-line">
        <span className="text-sm text-txt-secondary font-medium">Activity feed</span>
      </div>
      <div className="max-h-48 overflow-y-auto divide-y divide-line">
        {events.length === 0 ? (
          <div className="p-4 text-center text-sm text-txt-muted">Waiting for detections...</div>
        ) : (
          events.map((evt) => (
            <div key={evt.id} className="px-4 py-2 flex items-start gap-3">
              <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${typeDot[evt.type]}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${typeStyles[evt.type]} truncate`}>{evt.text}</p>
                <p className="text-xs text-txt-muted font-mono">{evt.time.toLocaleTimeString()}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
