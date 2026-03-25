export default function TheftAlertPanel({ activeThefts, onAccept, onReject, onDismiss }) {
  if (activeThefts.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 flex flex-col items-center justify-center gap-3 min-h-48">
        <div className="w-10 h-10 rounded-full border-2 border-gray-700 flex items-center justify-center">
          <span className="text-gray-600 text-lg">✓</span>
        </div>
        <p className="text-xs text-gray-600 tracking-widest uppercase">No active theft alerts</p>
        <p className="text-xs text-gray-700">System is monitoring</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-red-800 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-red-900/40 border-b border-red-800">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs text-red-300 tracking-widest uppercase font-bold">
            Active Theft Alerts
          </span>
        </div>
        <span className="text-xs bg-red-800 text-red-200 px-2 py-0.5 rounded-full">
          {activeThefts.length}
        </span>
      </div>

      <div className="divide-y divide-gray-800">
        {activeThefts.map((theft) => (
          <div key={theft.id} className="p-4 space-y-3">
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
              <span className="text-xs bg-red-900 text-red-300 px-2 py-0.5 rounded-full">
                UNREVIEWED
              </span>
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
                <span className="text-white">{new Date(theft.timestamp).toLocaleTimeString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Dwell frames</span>
                <span className="text-red-400 font-medium">{theft.dwellFrames ?? "8+"}</span>
              </div>
            </div>

            {/* Reason */}
            <div className="text-xs text-red-400 bg-red-950/50 rounded px-2 py-1.5 border border-red-900">
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
        ))}
      </div>
    </div>
  );
}
