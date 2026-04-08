const SEVERITY_CONFIG = {
  high: {
    border: "border-red-700",
    headerBg: "bg-red-900/50",
    headerBorder: "border-red-700",
    dot: "bg-red-500",
    badge: "bg-red-800 text-red-200",
    label: "HIGH SEVERITY",
    labelColor: "text-red-300",
    reasonBg: "bg-red-950/50 border-red-800",
    reasonText: "text-red-400",
  },
  medium: {
    border: "border-yellow-700",
    headerBg: "bg-yellow-900/30",
    headerBorder: "border-yellow-700",
    dot: "bg-yellow-500",
    badge: "bg-yellow-800 text-yellow-200",
    label: "MEDIUM SEVERITY",
    labelColor: "text-yellow-300",
    reasonBg: "bg-yellow-950/50 border-yellow-800",
    reasonText: "text-yellow-400",
  },
  low: {
    border: "border-blue-700",
    headerBg: "bg-blue-900/20",
    headerBorder: "border-blue-700",
    dot: "bg-blue-500",
    badge: "bg-blue-800 text-blue-200",
    label: "LOW SEVERITY",
    labelColor: "text-blue-300",
    reasonBg: "bg-blue-950/50 border-blue-800",
    reasonText: "text-blue-400",
  },
};

export default function TheftAlertPanel({ activeThefts, onAccept, onReject, onDismiss }) {
  if (activeThefts.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 flex flex-col items-center justify-center gap-3 min-h-48">
        <div className="w-10 h-10 rounded-full border-2 border-gray-700 flex items-center justify-center">
          <span className="text-gray-600 text-lg">&#10003;</span>
        </div>
        <p className="text-xs text-gray-500 tracking-widest uppercase">No active theft alerts</p>
        <p className="text-xs text-gray-600">System is monitoring</p>
      </div>
    );
  }

  // Sort by severity: high first, then medium, then low
  const sortOrder = { high: 0, medium: 1, low: 2 };
  const sorted = [...activeThefts].sort(
    (a, b) => (sortOrder[a.severity] ?? 2) - (sortOrder[b.severity] ?? 2)
  );

  const highCount = sorted.filter((t) => t.severity === "high").length;
  const medCount = sorted.filter((t) => t.severity === "medium").length;
  const lowCount = sorted.filter((t) => t.severity === "low").length;

  return (
    <div className="space-y-3">
      {/* Summary bar */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs text-white tracking-widest uppercase font-bold">
            {sorted.length} Alert{sorted.length > 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex gap-2">
          {highCount > 0 && (
            <span className="text-xs bg-red-800 text-red-200 px-2 py-0.5 rounded-full">
              {highCount} high
            </span>
          )}
          {medCount > 0 && (
            <span className="text-xs bg-yellow-800 text-yellow-200 px-2 py-0.5 rounded-full">
              {medCount} med
            </span>
          )}
          {lowCount > 0 && (
            <span className="text-xs bg-blue-800 text-blue-200 px-2 py-0.5 rounded-full">
              {lowCount} low
            </span>
          )}
        </div>
      </div>

      {/* Individual alerts */}
      {sorted.map((theft) => {
        const sev = SEVERITY_CONFIG[theft.severity] || SEVERITY_CONFIG.low;

        return (
          <div
            key={theft.id}
            className={`bg-gray-900 border ${sev.border} rounded-lg overflow-hidden`}
          >
            {/* Severity header */}
            <div
              className={`flex items-center justify-between px-4 py-2.5 ${sev.headerBg} border-b ${sev.headerBorder}`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${sev.dot} ${theft.severity === "high" ? "animate-pulse" : ""}`} />
                <span className={`text-xs ${sev.labelColor} tracking-widest uppercase font-bold`}>
                  {sev.label}
                </span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${sev.badge}`}>
                {theft.severity === "high" ? "ACTION REQUIRED" : "UNREVIEWED"}
              </span>
            </div>

            <div className="p-4 space-y-3">
              {/* Object info */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-bold text-white capitalize">
                    {theft.object_class}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Track ID #{theft.track_id}
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="bg-gray-800 rounded p-2.5 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Zone</span>
                  <span className="text-yellow-400 font-medium">BAG ZONE</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Confidence</span>
                  <span className="text-white">{(theft.confidence * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Detected</span>
                  <span className="text-white">
                    {new Date(theft.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Dwell frames</span>
                  <span className={`font-medium ${sev.reasonText}`}>
                    {theft.dwellFrames}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Severity score</span>
                  <span className={`font-bold uppercase ${sev.labelColor}`}>
                    {theft.severity}
                  </span>
                </div>
              </div>

              {/* Reason */}
              <div className={`text-xs ${sev.reasonText} rounded px-2 py-1.5 border ${sev.reasonBg}`}>
                {theft.alert_reason}
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onAccept(theft.id)}
                  className="py-2 px-3 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded transition-colors"
                >
                  Confirm Theft
                </button>
                <button
                  onClick={() => onReject(theft.id)}
                  className="py-2 px-3 bg-green-800 hover:bg-green-700 text-green-200 text-xs font-bold rounded transition-colors"
                >
                  False Alarm
                </button>
              </div>
              <button
                onClick={() => onDismiss(theft.id)}
                className="w-full py-1.5 text-xs text-gray-600 hover:text-gray-400 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}