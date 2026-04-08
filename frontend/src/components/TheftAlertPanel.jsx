const SEV = {
  high:   { bg: "bg-accent-red/8",  border: "border-l-accent-red",  text: "text-accent-red",  label: "High" },
  medium: { bg: "bg-accent-yellow/8", border: "border-l-accent-yellow", text: "text-accent-yellow", label: "Medium" },
  low:    { bg: "bg-accent-blue/8",  border: "border-l-accent-blue",  text: "text-accent-blue",  label: "Low" },
};

export default function TheftAlertPanel({ activeThefts, onAccept, onReject, onDismiss }) {
  if (activeThefts.length === 0) {
    return (
      <div className="bg-surface-1 rounded-lg p-5 text-center">
        <p className="text-xs text-txt-muted">No active alerts</p>
        <p className="text-xs text-txt-muted mt-0.5 opacity-50">System is monitoring</p>
      </div>
    );
  }

  const sortOrder = { high: 0, medium: 1, low: 2 };
  const sorted = [...activeThefts].sort((a, b) => (sortOrder[a.severity] ?? 2) - (sortOrder[b.severity] ?? 2));

  return (
    <div className="space-y-2">
      {sorted.map((theft) => {
        const s = SEV[theft.severity] || SEV.low;
        return (
          <div key={theft.id} className={`${s.bg} rounded-lg border-l-2 ${s.border} p-3`}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <span className="text-sm font-medium capitalize">{theft.object_class}</span>
                <span className="text-xs text-txt-muted ml-2">#{theft.track_id}</span>
              </div>
              <span className={`text-xs font-mono font-medium ${s.text}`}>{s.label}</span>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mb-3">
              <span className="text-txt-muted">Confidence</span>
              <span className="text-right font-mono">{(theft.confidence * 100).toFixed(0)}%</span>
              <span className="text-txt-muted">Dwell</span>
              <span className={`text-right font-mono ${s.text}`}>{theft.dwellFrames} frames</span>
              <span className="text-txt-muted">Time</span>
              <span className="text-right font-mono">{new Date(theft.timestamp).toLocaleTimeString()}</span>
            </div>

            <div className="text-xs text-txt-muted font-mono bg-surface-0/50 rounded px-2 py-1.5 mb-3 truncate">
              {theft.alert_reason}
            </div>

            <div className="flex gap-2">
              <button onClick={() => onAccept(theft.id)} className="flex-1 text-xs py-1.5 rounded bg-accent-red/20 text-accent-red hover:bg-accent-red/30 transition-colors font-medium">
                Confirm
              </button>
              <button onClick={() => onReject(theft.id)} className="flex-1 text-xs py-1.5 rounded bg-accent-green/20 text-accent-green hover:bg-accent-green/30 transition-colors font-medium">
                False alarm
              </button>
              <button onClick={() => onDismiss(theft.id)} className="text-xs py-1.5 px-3 rounded text-txt-muted hover:text-txt-secondary transition-colors">
                Dismiss
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}