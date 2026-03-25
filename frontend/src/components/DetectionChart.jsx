import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function DetectionChart({ fpsHistory, detectionHistory }) {
  // Combine both datasets by index
  const chartData = fpsHistory.map((item, i) => ({
    index: i,
    fps: item.fps,
    detections: detectionHistory[i]?.count % 20 ?? 0, // normalize for display
  }));

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-gray-400 tracking-widest uppercase">
          Performance — Last 30s
        </span>
        <div className="flex gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-green-400 inline-block" />
            <span className="text-gray-400">FPS</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-blue-400 inline-block" />
            <span className="text-gray-400">Detections</span>
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis dataKey="index" hide />
          <YAxis stroke="#4b5563" tick={{ fontSize: 10, fill: "#6b7280" }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#111827",
              border: "1px solid #374151",
              borderRadius: "6px",
              fontSize: "11px",
              color: "#e5e7eb",
            }}
          />
          <Line
            type="monotone"
            dataKey="fps"
            stroke="#4ade80"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="detections"
            stroke="#60a5fa"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}