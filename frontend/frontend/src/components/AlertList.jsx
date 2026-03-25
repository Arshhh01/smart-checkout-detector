export default function AlertList({ alerts, onReview }) {
  const statusColors = {
    unreviewed: "bg-gray-700 text-gray-300",
    confirmed: "bg-red-900 text-red-300",
    "false-positive": "bg-green-900 text-green-300",
    unclear: "bg-yellow-900 text-yellow-300",
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <span className="text-xs text-gray-400 tracking-widest uppercase">Alert History</span>
        <span className="text-xs bg-red-900 text-red-300 px-2 py-0.5 rounded-full">
          {alerts.filter((a) => a.review_status === "unreviewed").length} new
        </span>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-gray-800" style={{ maxHeight: "520px" }}>
        {alerts.length === 0 ? (
          <div className="p-6 text-center text-gray-600 text-sm">
            No alerts yet
          </div>
        ) : (
          alerts.map((alert) => (
            <div key={alert.id} className="p-3 hover:bg-gray-800 transition-colors">
              {/* Alert header */}
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="text-sm font-bold text-white capitalize">
                    {alert.object_class}
                  </span>
                  <span className="text-xs text-gray-500 ml-2">
                    #{alert.track_id}
                  </span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[alert.review_status]}`}>
                  {alert.review_status}
                </span>
              </div>

              {/* Alert details */}
              <div className="text-xs text-gray-500 mb-2 space-y-0.5">
                <div>Zone: <span className="text-gray-300">{alert.zone}</span></div>
                <div>Confidence: <span className="text-gray-300">{(alert.confidence * 100).toFixed(0)}%</span></div>
                <div>Time: <span className="text-gray-300">{new Date(alert.timestamp).toLocaleTimeString()}</span></div>
              </div>

              {/* Review buttons */}
              <div className="flex gap-1.5 mt-2">
                <button
                  onClick={() => onReview(alert.id, "confirmed")}
                  className={`flex-1 text-xs py-1 rounded transition-colors ${
                    alert.review_status === "confirmed"
                      ? "bg-red-600 text-white"
                      : "bg-gray-800 text-gray-400 hover:bg-red-900 hover:text-red-300"
                  }`}
                >
                  Confirm
                </button>
                <button
                  onClick={() => onReview(alert.id, "false-positive")}
                  className={`flex-1 text-xs py-1 rounded transition-colors ${
                    alert.review_status === "false-positive"
                      ? "bg-green-700 text-white"
                      : "bg-gray-800 text-gray-400 hover:bg-green-900 hover:text-green-300"
                  }`}
                >
                  False +
                </button>
                <button
                  onClick={() => onReview(alert.id, "unclear")}
                  className={`flex-1 text-xs py-1 rounded transition-colors ${
                    alert.review_status === "unclear"
                      ? "bg-yellow-700 text-white"
                      : "bg-gray-800 text-gray-400 hover:bg-yellow-900 hover:text-yellow-300"
                  }`}
                >
                  Unclear
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}