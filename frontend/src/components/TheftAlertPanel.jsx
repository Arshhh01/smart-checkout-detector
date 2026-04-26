const SEV = {
  high:   { bg: "bg-red-500/10",   border: "border-l-red-500",    text: "text-red-400",    label: "High" },
  medium: { bg: "bg-yellow-500/10", border: "border-l-yellow-500", text: "text-yellow-400", label: "Medium" },
  low:    { bg: "bg-blue-500/10",   border: "border-l-blue-500",   text: "text-blue-400",   label: "Low" },
};

export default function TheftAlertPanel({ activeThefts, onAccept, onReject, onDismiss }) {
  if (activeThefts.length === 0) {
    return (
      <div className="bg-surface-1 border border-line rounded-xl p-8 text-center">
        <p className="text-sm text-txt-secondary">No active alerts</p>
        <p className="text-xs text-txt-muted mt-1">System is monitoring</p>
      </div>
    );
  }

  const sortOrder = { high: 0, medium: 1, low: 2 };
  const sorted = [...activeThefts].sort((a, b) => (sortOrder[a.severity] ?? 2) - (sortOrder[b.severity] ?? 2));

  return (
    <div className="space-y-3">
      {sorted.map((theft) => {
        const s = SEV[theft.severity] || SEV.low;
        return (
          <div key={theft.id} className={`${s.bg} rounded-xl border-l-4 ${s.border} border border-line p-4`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className="text-base font-semibold text-white capitalize">{theft.object_class}</span>
                <span className="text-sm text-txt-secondary ml-2">#{theft.track_id}</span>
              </div>
              <span className={`text-sm font-mono font-semibold ${s.text}`}>{s.label}</span>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm mb-4">
              <span className="text-txt-secondary">Confidence</span>
              <span className="text-right font-mono text-white">{(theft.confidence * 100).toFixed(0)}%</span>
              <span className="text-txt-secondary">Dwell</span>
              <span className={`text-right font-mono ${s.text}`}>{theft.dwellFrames} frames</span>
              <span className="text-txt-secondary">Time</span>
              <span className="text-right font-mono text-white">{new Date(theft.timestamp).toLocaleTimeString()}</span>
            </div>

            <div className="text-sm text-txt-secondary font-mono bg-surface-0/60 rounded-lg px-3 py-2 mb-4">
              {theft.alert_reason}
            </div>

            <div className="flex gap-2">
              <button onClick={() => onAccept(theft.id)} className="flex-1 text-sm py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors font-semibold">
                Confirm
              </button>
              <button onClick={() => onReject(theft.id)} className="flex-1 text-sm py-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors font-semibold">
                False alarm
              </button>
              <button onClick={() => onDismiss(theft.id)} className="text-sm py-2 px-4 rounded-lg text-txt-muted hover:text-white transition-colors">
                Dismiss
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}