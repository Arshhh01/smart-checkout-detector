export default function StatsCards({ detectionCount, alertCount, unreviewedCount, fps, accuracy }) {
  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="bg-surface-1 rounded-lg px-4 py-3">
        <div className="text-xs text-txt-muted mb-1">Objects tracked</div>
        <div className="text-2xl font-mono font-medium">{detectionCount}</div>
      </div>
      <div className="bg-surface-1 rounded-lg px-4 py-3">
        <div className="text-xs text-txt-muted mb-1">Alerts</div>
        <div className="flex items-baseline gap-2">
          <span className={`text-2xl font-mono font-medium ${alertCount > 0 ? "text-accent-red" : ""}`}>{alertCount}</span>
          {unreviewedCount > 0 && (
            <span className="text-xs text-txt-muted">{unreviewedCount} pending</span>
          )}
        </div>
      </div>
      <div className="bg-surface-1 rounded-lg px-4 py-3">
        <div className="text-xs text-txt-muted mb-1">FPS</div>
        <div className={`text-2xl font-mono font-medium ${fps > 10 ? "text-accent-green" : fps > 0 ? "text-accent-yellow" : "text-txt-muted"}`}>
          {fps > 0 ? fps.toFixed(1) : "—"}
        </div>
      </div>
      <div className="bg-surface-1 rounded-lg px-4 py-3">
        <div className="text-xs text-txt-muted mb-1">Accuracy</div>
        <div className="text-2xl font-mono font-medium">{accuracy}%</div>
      </div>
    </div>
  );
}