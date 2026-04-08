import { useMemo } from "react";

const MOCK_PRICES = {
  "cell phone": 29.99, bottle: 2.49, cup: 4.99, bowl: 6.99, book: 14.99,
  laptop: 49.99, mouse: 12.99, keyboard: 19.99, scissors: 7.99, toothbrush: 3.49,
  "hair drier": 24.99, apple: 1.29, orange: 1.49, banana: 0.59, sandwich: 6.99,
  cake: 24.99, donut: 2.99, "wine glass": 8.99, fork: 2.99, knife: 3.99,
  spoon: 2.99, can: 1.99, backpack: 19.99, handbag: 24.99, suitcase: 39.99, umbrella: 9.99,
};

function getPrice(cls) { return MOCK_PRICES[cls?.toLowerCase().trim()] ?? 9.99; }

export default function SessionSummary({ alerts, clearedItems, detectionCount, sessionStart, onClose }) {
  const report = useMemo(() => {
    const confirmed = alerts.filter((a) => a.review_status === "confirmed");
    const falsePos = alerts.filter((a) => a.review_status === "false-positive");
    const unclear = alerts.filter((a) => a.review_status === "unclear");
    const unreviewed = alerts.filter((a) => a.review_status === "unreviewed");
    const revenue = clearedItems.reduce((sum, item) => sum + getPrice(item.object_class), 0);
    const tax = revenue * 0.0625;
    const lostRevenue = confirmed.reduce((sum, a) => sum + getPrice(a.object_class), 0);
    const avgConf = alerts.length > 0 ? alerts.reduce((sum, a) => sum + (a.confidence ?? 0), 0) / alerts.length : 0;
    const dur = Math.max(1, Math.floor((Date.now() - sessionStart) / 1000));
    const mins = Math.floor(dur / 60), secs = dur % 60;

    const clearedBreakdown = {};
    for (const item of clearedItems) {
      const c = item.object_class?.toLowerCase() || "unknown";
      if (!clearedBreakdown[c]) clearedBreakdown[c] = { count: 0, revenue: 0 };
      clearedBreakdown[c].count++;
      clearedBreakdown[c].revenue += getPrice(c);
    }

    const theftBreakdown = {};
    for (const a of confirmed) {
      const c = a.object_class?.toLowerCase() || "unknown";
      if (!theftBreakdown[c]) theftBreakdown[c] = { count: 0, value: 0 };
      theftBreakdown[c].count++;
      theftBreakdown[c].value += getPrice(c);
    }

    return { confirmed, falsePos, unclear, unreviewed, revenue, tax, lostRevenue, avgConf, mins, secs, clearedBreakdown, theftBreakdown };
  }, [alerts, clearedItems, sessionStart]);

  const fpRate = alerts.length > 0 ? ((report.falsePos.length / alerts.length) * 100).toFixed(1) : "0.0";

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-surface-1 rounded-xl max-w-xl w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 flex items-center justify-between border-b border-line">
          <div>
            <h2 className="text-base font-medium">Session summary</h2>
            <p className="text-xs text-txt-muted mt-0.5 font-mono">{report.mins}m {report.secs}s · Station 1</p>
          </div>
          <button onClick={onClose} className="text-txt-muted hover:text-txt-primary text-lg px-2 transition-colors">&times;</button>
        </div>

        <div className="grid grid-cols-4 gap-3 p-5">
          <div className="bg-surface-2 rounded-lg p-3">
            <div className="text-xs text-txt-muted mb-1">Revenue</div>
            <div className="text-lg font-mono font-medium text-accent-green">${report.revenue.toFixed(2)}</div>
          </div>
          <div className="bg-surface-2 rounded-lg p-3">
            <div className="text-xs text-txt-muted mb-1">Loss prevented</div>
            <div className="text-lg font-mono font-medium text-accent-red">${report.lostRevenue.toFixed(2)}</div>
          </div>
          <div className="bg-surface-2 rounded-lg p-3">
            <div className="text-xs text-txt-muted mb-1">Items scanned</div>
            <div className="text-lg font-mono font-medium">{clearedItems.length}</div>
          </div>
          <div className="bg-surface-2 rounded-lg p-3">
            <div className="text-xs text-txt-muted mb-1">Objects tracked</div>
            <div className="text-lg font-mono font-medium">{detectionCount}</div>
          </div>
        </div>

        <div className="px-5 pb-4">
          <h3 className="text-xs text-txt-muted mb-2">Detection performance</h3>
          <div className="bg-surface-2 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-txt-secondary">Total alerts</span><span className="font-mono">{alerts.length}</span></div>
            <div className="flex justify-between"><span className="text-txt-secondary">Confirmed thefts</span><span className="font-mono text-accent-red">{report.confirmed.length}</span></div>
            <div className="flex justify-between"><span className="text-txt-secondary">False positives</span><span className="font-mono text-accent-green">{report.falsePos.length}</span></div>
            <div className="flex justify-between"><span className="text-txt-secondary">Pending review</span><span className="font-mono">{report.unclear.length + report.unreviewed.length}</span></div>
            <div className="border-t border-line pt-2 flex justify-between"><span className="text-txt-secondary">False positive rate</span><span className="font-mono">{fpRate}%</span></div>
            <div className="flex justify-between"><span className="text-txt-secondary">Avg confidence</span><span className="font-mono">{(report.avgConf * 100).toFixed(1)}%</span></div>
          </div>
        </div>

        {Object.keys(report.clearedBreakdown).length > 0 && (
          <div className="px-5 pb-4">
            <h3 className="text-xs text-txt-muted mb-2">Scanned items</h3>
            <div className="bg-surface-2 rounded-lg overflow-hidden">
              {Object.entries(report.clearedBreakdown).map(([cls, d]) => (
                <div key={cls} className="px-4 py-2 flex items-center justify-between border-b border-line last:border-0">
                  <span className="text-sm capitalize">{cls} <span className="text-txt-muted">x{d.count}</span></span>
                  <span className="text-sm font-mono text-accent-green">${d.revenue.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {Object.keys(report.theftBreakdown).length > 0 && (
          <div className="px-5 pb-4">
            <h3 className="text-xs text-txt-muted mb-2">Confirmed theft attempts</h3>
            <div className="bg-accent-red/5 rounded-lg overflow-hidden border border-accent-red/10">
              {Object.entries(report.theftBreakdown).map(([cls, d]) => (
                <div key={cls} className="px-4 py-2 flex items-center justify-between border-b border-accent-red/10 last:border-0">
                  <span className="text-sm capitalize">{cls} <span className="text-txt-muted">x{d.count}</span></span>
                  <span className="text-sm font-mono text-accent-red">${d.value.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="px-5 py-3 border-t border-line flex items-center justify-between">
          <span className="text-xs text-txt-muted font-mono">{new Date().toLocaleString()}</span>
          <button onClick={onClose} className="text-xs px-4 py-1.5 rounded bg-surface-2 text-txt-secondary hover:text-txt-primary transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}