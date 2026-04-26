export default function StatsCards({ detectionCount, alertCount, unreviewedCount, fps, accuracy }) {
  return (
    <div className="grid grid-cols-4 gap-5">
      <div className="bg-surface-1 rounded-xl px-5 py-4">
        <div className="text-sm text-txt-secondary mb-2">Objects tracked</div>
        <div className="text-3xl font-mono font-medium text-txt-primary">{detectionCount}</div>
      </div>
      <div className="bg-surface-1 rounded-xl px-5 py-4">
        <div className="text-sm text-txt-secondary mb-2">Alerts</div>
        <div className="flex items-baseline gap-3">
          <span className={`text-3xl font-mono font-medium ${alertCount > 0 ? "text-accent-red" : "text-txt-primary"}`}>{alertCount}</span>
          {unreviewedCount > 0 && (
            <span className="text-sm text-txt-secondary">{unreviewedCount} pending</span>
          )}
        </div>
      </div>
      <div className="bg-surface-1 rounded-xl px-5 py-4">
        <div className="text-sm text-txt-secondary mb-2">FPS</div>
        <div className={`text-3xl font-mono font-medium ${fps > 10 ? "text-accent-green" : fps > 0 ? "text-accent-yellow" : "text-txt-muted"}`}>
          {fps > 0 ? fps.toFixed(1) : "—"}
        </div>
      </div>
      <div className="bg-surface-1 rounded-xl px-5 py-4">
        <div className="text-sm text-txt-secondary mb-2">Accuracy</div>
        <div className="text-3xl font-mono font-medium text-txt-primary">{accuracy}%</div>
      </div>
    </div>
  );
}