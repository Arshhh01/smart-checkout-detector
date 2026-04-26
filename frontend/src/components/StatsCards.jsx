export default function StatsCards({ detectionCount, alertCount, unreviewedCount, fps, accuracy }) {
  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="bg-surface-1 border border-line rounded-xl p-5">
        <div className="text-sm text-txt-secondary mb-3 font-medium">Objects tracked</div>
        <div className="text-4xl font-mono font-bold text-white">{detectionCount}</div>
        <div className="text-xs text-txt-muted mt-2">unique this session</div>
      </div>
      <div className="bg-surface-1 border border-line rounded-xl p-5">
        <div className="text-sm text-txt-secondary mb-3 font-medium">Alerts</div>
        <div className="flex items-baseline gap-3">
          <span className={`text-4xl font-mono font-bold ${alertCount > 0 ? "text-accent-red" : "text-white"}`}>{alertCount}</span>
        </div>
        <div className="text-xs text-txt-muted mt-2">{unreviewedCount > 0 ? `${unreviewedCount} pending review` : "all reviewed"}</div>
      </div>
      <div className="bg-surface-1 border border-line rounded-xl p-5">
        <div className="text-sm text-txt-secondary mb-3 font-medium">FPS</div>
        <div className={`text-4xl font-mono font-bold ${fps > 10 ? "text-accent-green" : fps > 0 ? "text-accent-yellow" : "text-txt-muted"}`}>
          {fps > 0 ? fps.toFixed(1) : "—"}
        </div>
        <div className="text-xs text-txt-muted mt-2">inference rate</div>
      </div>
      <div className="bg-surface-1 border border-line rounded-xl p-5">
        <div className="text-sm text-txt-secondary mb-3 font-medium">Accuracy</div>
        <div className="text-4xl font-mono font-bold text-white">{accuracy}%</div>
        <div className="text-xs text-txt-muted mt-2">confirmed / total</div>
      </div>
    </div>
  );
}