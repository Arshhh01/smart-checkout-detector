export default function ClearedItemsPanel({ clearedItems }) {
  if (clearedItems.length === 0) {
    return (
      <div className="bg-surface-1 rounded-lg p-5 text-center">
        <p className="text-xs text-txt-muted">No cleared items</p>
        <p className="text-xs text-txt-muted mt-0.5 opacity-50">Scan an item, then move to bag zone</p>
      </div>
    );
  }

  return (
    <div className="bg-surface-1 rounded-lg overflow-hidden">
      <div className="px-3 py-2 flex items-center justify-between">
        <span className="text-xs text-txt-muted">Cleared items</span>
        <span className="text-xs font-mono text-accent-green">{clearedItems.length}</span>
      </div>
      <div className="divide-y divide-line">
        {clearedItems.map((item) => (
          <div key={item.id} className="px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-accent-green" />
              <span className="text-sm capitalize">{item.object_class}</span>
              <span className="text-xs text-txt-muted font-mono">#{item.track_id}</span>
            </div>
            <span className="text-xs text-txt-muted font-mono">{(item.confidence * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}