export default function AlertList({ alerts, onReview }) {
  const sevColors = {
    high: "text-accent-red bg-accent-red/10",
    medium: "text-accent-yellow bg-accent-yellow/10",
    low: "text-accent-blue bg-accent-blue/10",
  };
  const statusColors = {
    unreviewed: "text-txt-muted",
    confirmed: "text-accent-red",
    "false-positive": "text-accent-green",
    unclear: "text-accent-yellow",
  };

  const unreviewed = alerts.filter((a) => a.review_status === "unreviewed").length;

  return (
    <div className="bg-surface-1 rounded-lg overflow-hidden">
      <div className="px-3 py-2 flex items-center justify-between">
        <span className="text-xs text-txt-muted">Alert history</span>
        {unreviewed > 0 && (
          <span className="text-xs font-mono text-accent-red">{unreviewed} new</span>
        )}
      </div>

      <div className="divide-y divide-line max-h-[600px] overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="p-4 text-center text-xs text-txt-muted">No alerts — system monitoring</div>
        ) : (
          alerts.map((alert) => (
            <div key={alert.id} className="px-3 py-2.5">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium capitalize">{alert.object_class}</span>
                  <span className="text-xs text-txt-muted font-mono">#{alert.track_id}</span>
                  {alert.severity && (
                    <span className={`text-xs px-1.5 py-0.5 rounded font-mono ${sevColors[alert.severity] || sevColors.low}`}>
                      {alert.severity}
                    </span>
                  )}
                </div>
                <span className={`text-xs font-mono ${statusColors[alert.review_status] || "text-txt-muted"}`}>
                  {alert.review_status}
                </span>
              </div>

              <div className="text-xs text-txt-muted mb-2">
                {(alert.confidence * 100).toFixed(0)}% confidence
                {alert.timestamp && !alert.timestamp.includes("Invalid") && (
                  <span> · {new Date(alert.timestamp).toLocaleTimeString()}</span>
                )}
              </div>

              {alert.review_status === "unreviewed" && (
                <div className="flex gap-1.5">
                  <button onClick={() => onReview(alert.id, "confirmed")} className="flex-1 text-xs py-1 rounded bg-surface-2 text-txt-secondary hover:text-accent-red transition-colors">
                    Confirm
                  </button>
                  <button onClick={() => onReview(alert.id, "false-positive")} className="flex-1 text-xs py-1 rounded bg-surface-2 text-txt-secondary hover:text-accent-green transition-colors">
                    False +
                  </button>
                  <button onClick={() => onReview(alert.id, "unclear")} className="flex-1 text-xs py-1 rounded bg-surface-2 text-txt-secondary hover:text-accent-yellow transition-colors">
                    Unclear
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}