export default function AlertList({ alerts, onReview }) {
  const sevColors = {
    high: "text-red-400 bg-red-500/15",
    medium: "text-yellow-400 bg-yellow-500/15",
    low: "text-blue-400 bg-blue-500/15",
  };
  const statusColors = {
    unreviewed: "text-txt-muted",
    confirmed: "text-accent-red",
    "false-positive": "text-accent-green",
    unclear: "text-accent-yellow",
  };

  const unreviewed = alerts.filter((a) => a.review_status === "unreviewed").length;

  return (
    <div className="bg-surface-1 border border-line rounded-xl overflow-hidden">
      <div className="px-4 py-3 flex items-center justify-between border-b border-line">
        <span className="text-sm text-txt-secondary font-medium">Alert history</span>
        {unreviewed > 0 && (
          <span className="text-sm font-mono text-accent-red font-semibold">{unreviewed} new</span>
        )}
      </div>

      <div className="divide-y divide-line max-h-[620px] overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="p-6 text-center text-sm text-txt-muted">No alerts — system monitoring</div>
        ) : (
          alerts.map((alert) => (
            <div key={alert.id} className="px-4 py-3">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white capitalize">{alert.object_class}</span>
                  <span className="text-sm text-txt-muted font-mono">#{alert.track_id}</span>
                  {alert.severity && (
                    <span className={`text-xs px-2 py-0.5 rounded-md font-mono font-medium ${sevColors[alert.severity] || sevColors.low}`}>
                      {alert.severity}
                    </span>
                  )}
                </div>
                <span className={`text-sm font-mono ${statusColors[alert.review_status] || "text-txt-muted"}`}>
                  {alert.review_status}
                </span>
              </div>

              <div className="text-sm text-txt-secondary mb-2.5">
                {(alert.confidence * 100).toFixed(0)}% confidence
                {alert.timestamp && !alert.timestamp.includes("Invalid") && (
                  <span> · {new Date(alert.timestamp).toLocaleTimeString()}</span>
                )}
              </div>

              {alert.review_status === "unreviewed" && (
                <div className="flex gap-2">
                  <button onClick={() => onReview(alert.id, "confirmed")} className="flex-1 text-sm py-1.5 rounded-lg bg-surface-2 text-txt-secondary hover:text-accent-red transition-colors font-medium">
                    Confirm
                  </button>
                  <button onClick={() => onReview(alert.id, "false-positive")} className="flex-1 text-sm py-1.5 rounded-lg bg-surface-2 text-txt-secondary hover:text-accent-green transition-colors font-medium">
                    False +
                  </button>
                  <button onClick={() => onReview(alert.id, "unclear")} className="flex-1 text-sm py-1.5 rounded-lg bg-surface-2 text-txt-secondary hover:text-accent-yellow transition-colors font-medium">
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