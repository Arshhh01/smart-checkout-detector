export default function ClearedItemsPanel({ clearedItems }) {
  if (clearedItems.length === 0) {
    return (
      <div className="bg-surface-1 border border-line rounded-xl p-8 text-center">
        <p className="text-sm text-txt-secondary">No cleared items</p>
        <p className="text-xs text-txt-muted mt-1">Scan an item, then move to bag zone</p>
      </div>
    );
  }

  return (
    <div className="bg-surface-1 border border-line rounded-xl overflow-hidden">
      <div className="px-4 py-3 flex items-center justify-between border-b border-line">
        <span className="text-sm text-txt-secondary font-medium">Cleared items</span>
        <span className="text-sm font-mono text-accent-green font-semibold">{clearedItems.length}</span>
      </div>
      <div className="divide-y divide-line">
        {clearedItems.map((item) => (
          <div key={item.id} className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-accent-green" />
              <span className="text-sm text-white capitalize font-medium">{item.object_class}</span>
              <span className="text-sm text-txt-muted font-mono">#{item.track_id}</span>
            </div>
            <span className="text-sm text-txt-secondary font-mono">{(item.confidence * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}