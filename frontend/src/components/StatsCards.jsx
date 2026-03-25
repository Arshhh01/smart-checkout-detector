export default function StatsCards({ detectionCount, alertCount, unreviewedCount, fps, accuracy }) {
  const cards = [
    {
      label: "DETECTIONS",
      value: detectionCount,
      sub: "this session",
      icon: "👁",
      color: "border-blue-500",
      textColor: "text-blue-400",
    },
    {
      label: "ALERTS",
      value: alertCount,
      sub: unreviewedCount > 0 ? `${unreviewedCount} unreviewed` : "all reviewed",
      icon: "🚨",
      color: "border-red-500",
      textColor: "text-red-400",
    },
    {
      label: "FPS",
      value: fps > 0 ? fps.toFixed(1) : "—",
      sub: "inference rate",
      icon: "⚡",
      color: "border-green-500",
      textColor: "text-green-400",
    },
    {
      label: "ACCURACY",
      value: accuracy === "N/A" ? "N/A" : `${accuracy}%`,
      sub: "confirmed / total",
      icon: "🎯",
      color: "border-yellow-500",
      textColor: "text-yellow-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`bg-gray-900 border ${card.color} rounded-lg p-4 flex flex-col gap-1`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 tracking-widest">{card.label}</span>
            <span className="text-lg">{card.icon}</span>
          </div>
          <div className={`text-3xl font-bold ${card.textColor}`}>{card.value}</div>
          <div className="text-xs text-gray-600">{card.sub}</div>
        </div>
      ))}
    </div>
  );
}