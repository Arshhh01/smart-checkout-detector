import { useMemo } from "react";

const MOCK_PRICES = {
  "cell phone": 120.99,
  bottle: 2.49,
  cup: 4.99,
  bowl: 6.99,
  book: 14.99,
  laptop: 1299.99,
  mouse: 29.99,
  keyboard: 49.99,
  scissors: 7.99,
  toothbrush: 3.49,
  "hair drier": 24.99,
  apple: 1.29,
  orange: 1.49,
  banana: 0.59,
  sandwich: 6.99,
  cake: 24.99,
  donut: 2.99,
  "wine glass": 12.99,
  fork: 2.99,
  knife: 3.99,
  spoon: 2.99,
  can: 1.99,
  backpack: 39.99,
  handbag: 59.99,
  suitcase: 89.99,
  umbrella: 15.99,
};

function getPrice(objectClass) {
  const key = objectClass?.toLowerCase().trim();
  return MOCK_PRICES[key] ?? 9.99;
}

export default function SessionSummary({
  alerts,
  clearedItems,
  detectionCount,
  sessionStart,
  onClose,
}) {
  const report = useMemo(() => {
    const confirmed = alerts.filter((a) => a.review_status === "confirmed");
    const falsePos = alerts.filter((a) => a.review_status === "false-positive");
    const unclear = alerts.filter((a) => a.review_status === "unclear");
    const unreviewed = alerts.filter((a) => a.review_status === "unreviewed");

    const revenue = clearedItems.reduce((sum, item) => sum + getPrice(item.object_class), 0);
    const tax = revenue * 0.0625;
    const lostRevenue = confirmed.reduce((sum, a) => sum + getPrice(a.object_class), 0);
    const preventedRevenue = falsePos.reduce((sum, a) => sum + getPrice(a.object_class), 0);

    const avgConfidence =
      alerts.length > 0
        ? alerts.reduce((sum, a) => sum + (a.confidence ?? 0), 0) / alerts.length
        : 0;

    const duration = Math.max(1, Math.floor((Date.now() - sessionStart) / 1000));
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;

    // Item breakdown — group cleared items by class
    const clearedBreakdown = {};
    for (const item of clearedItems) {
      const cls = item.object_class?.toLowerCase() || "unknown";
      if (!clearedBreakdown[cls]) {
        clearedBreakdown[cls] = { count: 0, revenue: 0 };
      }
      clearedBreakdown[cls].count += 1;
      clearedBreakdown[cls].revenue += getPrice(cls);
    }

    // Theft breakdown — group confirmed thefts by class
    const theftBreakdown = {};
    for (const alert of confirmed) {
      const cls = alert.object_class?.toLowerCase() || "unknown";
      if (!theftBreakdown[cls]) {
        theftBreakdown[cls] = { count: 0, value: 0 };
      }
      theftBreakdown[cls].count += 1;
      theftBreakdown[cls].value += getPrice(cls);
    }

    return {
      confirmed,
      falsePos,
      unclear,
      unreviewed,
      revenue,
      tax,
      lostRevenue,
      preventedRevenue,
      avgConfidence,
      minutes,
      seconds,
      clearedBreakdown,
      theftBreakdown,
    };
  }, [alerts, clearedItems, sessionStart]);

  const falsePositiveRate =
    alerts.length > 0
      ? ((report.falsePos.length / alerts.length) * 100).toFixed(1)
      : "0.0";

  const detectionAccuracy =
    alerts.length > 0
      ? (((report.confirmed.length + report.falsePos.length) / alerts.length) * 100).toFixed(1)
      : "N/A";

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide">
              Session Summary Report
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Duration: {report.minutes}m {report.seconds}s · Station #1 · Cam_0
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white text-xl px-2"
          >
            ✕
          </button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-6">
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">Revenue</div>
            <div className="text-xl font-bold text-green-400">
              ${report.revenue.toFixed(2)}
            </div>
            <div className="text-xs text-gray-600 mt-0.5">
              +${report.tax.toFixed(2)} tax
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">Loss Prevented</div>
            <div className="text-xl font-bold text-red-400">
              ${report.lostRevenue.toFixed(2)}
            </div>
            <div className="text-xs text-gray-600 mt-0.5">
              {report.confirmed.length} confirmed theft{report.confirmed.length !== 1 ? "s" : ""}
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">Items Scanned</div>
            <div className="text-xl font-bold text-white">
              {clearedItems.length}
            </div>
            <div className="text-xs text-gray-600 mt-0.5">
              properly cleared
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">Total Frames</div>
            <div className="text-xl font-bold text-white">
              {detectionCount.toLocaleString()}
            </div>
            <div className="text-xs text-gray-600 mt-0.5">
              processed by YOLO
            </div>
          </div>
        </div>

        {/* Detection Performance */}
        <div className="px-6 pb-4">
          <h3 className="text-xs text-gray-500 tracking-widest uppercase mb-3">
            Detection Performance
          </h3>
          <div className="bg-gray-800 rounded-lg p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Total alerts triggered</span>
              <span className="text-white font-medium">{alerts.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Confirmed thefts</span>
              <span className="text-red-400 font-medium">{report.confirmed.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">False positives</span>
              <span className="text-green-400 font-medium">{report.falsePos.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Unclear / unreviewed</span>
              <span className="text-yellow-400 font-medium">
                {report.unclear.length + report.unreviewed.length}
              </span>
            </div>
            <div className="border-t border-gray-700 pt-3 flex justify-between text-sm">
              <span className="text-gray-400">False positive rate</span>
              <span className="text-white font-medium">{falsePositiveRate}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Avg detection confidence</span>
              <span className="text-white font-medium">
                {(report.avgConfidence * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Review completion</span>
              <span className="text-white font-medium">{detectionAccuracy}%</span>
            </div>
          </div>
        </div>

        {/* Scanned Items Breakdown */}
        {Object.keys(report.clearedBreakdown).length > 0 && (
          <div className="px-6 pb-4">
            <h3 className="text-xs text-gray-500 tracking-widest uppercase mb-3">
              Scanned Items Breakdown
            </h3>
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="grid grid-cols-3 gap-px text-xs text-gray-500 px-4 py-2 border-b border-gray-700">
                <span>Item</span>
                <span className="text-center">Qty</span>
                <span className="text-right">Revenue</span>
              </div>
              {Object.entries(report.clearedBreakdown).map(([cls, data]) => (
                <div
                  key={cls}
                  className="grid grid-cols-3 gap-px text-sm px-4 py-2 border-b border-gray-800/50"
                >
                  <span className="text-white capitalize">{cls}</span>
                  <span className="text-center text-gray-400">{data.count}</span>
                  <span className="text-right text-green-400">
                    ${data.revenue.toFixed(2)}
                  </span>
                </div>
              ))}
              <div className="grid grid-cols-3 gap-px text-sm px-4 py-2 font-medium">
                <span className="text-gray-400">Total</span>
                <span className="text-center text-white">{clearedItems.length}</span>
                <span className="text-right text-green-400">
                  ${report.revenue.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Theft Attempts Breakdown */}
        {Object.keys(report.theftBreakdown).length > 0 && (
          <div className="px-6 pb-4">
            <h3 className="text-xs text-gray-500 tracking-widest uppercase mb-3">
              Confirmed Theft Attempts
            </h3>
            <div className="bg-red-950/30 border border-red-900/50 rounded-lg overflow-hidden">
              <div className="grid grid-cols-3 gap-px text-xs text-gray-500 px-4 py-2 border-b border-red-900/30">
                <span>Item</span>
                <span className="text-center">Attempts</span>
                <span className="text-right">Est. Value</span>
              </div>
              {Object.entries(report.theftBreakdown).map(([cls, data]) => (
                <div
                  key={cls}
                  className="grid grid-cols-3 gap-px text-sm px-4 py-2 border-b border-red-900/20"
                >
                  <span className="text-white capitalize">{cls}</span>
                  <span className="text-center text-gray-400">{data.count}</span>
                  <span className="text-right text-red-400">
                    ${data.value.toFixed(2)}
                  </span>
                </div>
              ))}
              <div className="grid grid-cols-3 gap-px text-sm px-4 py-2 font-medium">
                <span className="text-red-400">Loss prevented</span>
                <span className="text-center text-white">
                  {report.confirmed.length}
                </span>
                <span className="text-right text-red-400">
                  ${report.lostRevenue.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-800 flex items-center justify-between">
          <p className="text-xs text-gray-600">
            Generated {new Date().toLocaleString()} · Smart Checkout Detector v1.0
          </p>
          <button
            onClick={onClose}
            className="text-xs px-4 py-2 rounded bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
}
