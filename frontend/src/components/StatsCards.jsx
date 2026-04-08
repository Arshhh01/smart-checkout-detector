export default function StatsCards({ detectionCount, alertCount, unreviewedCount, fps, accuracy }) {
  const cards = [
    {
      label: "Objects Tracked",
      value: detectionCount,
      sub: "unique this session",
      accent: "border-l-blue-500",
      valueColor: "text-white",
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-blue-400">
          <circle cx="8" cy="8" r="3" />
          <circle cx="8" cy="8" r="6.5" strokeDasharray="2 2" />
        </svg>
      ),
    },
    {
      label: "Alerts",
      value: alertCount,
      sub: unreviewedCount > 0 ? `${unreviewedCount} unreviewed` : "all reviewed",
      accent: "border-l-red-500",
      valueColor: alertCount > 0 ? "text-red-400" : "text-white",
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-red-400">
          <path d="M8 2L14 13H2L8 2Z" />
          <line x1="8" y1="7" x2="8" y2="9.5" />
          <circle cx="8" cy="11" r="0.5" fill="currentColor" />
        </svg>
      ),
    },
    {
      label: "FPS",
      value: fps > 0 ? fps.toFixed(1) : "—",
      sub: "inference rate",
      accent: "border-l-green-500",
      valueColor: fps > 10 ? "text-green-400" : fps > 0 ? "text-yellow-400" : "text-gray-500",
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-green-400">
          <polyline points="2,12 5,6 8,9 11,3 14,7" />
        </svg>
      ),
    },
    {
      label: "Accuracy",
      value: accuracy === "N/A" ? "N/A" : `${accuracy}%`,
      sub: "confirmed / total",
      accent: "border-l-yellow-500",
      valueColor: "text-white",
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-yellow-400">
          <circle cx="8" cy="8" r="6.5" />
          <path d="M5.5 8L7.5 10L11 5.5" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`bg-gray-900 border border-gray-800 border-l-2 ${card.accent} rounded-lg p-4`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 tracking-widest uppercase">
              {card.label}
            </span>
            {card.icon}
          </div>
          <div className={`text-2xl font-bold ${card.valueColor}`}>
            {card.value}
          </div>
          <div className="text-xs text-gray-600 mt-1">{card.sub}</div>
        </div>
      ))}
    </div>
  );
}