export default function ClearedItemsPanel({ clearedItems }) {
  if (clearedItems.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 flex flex-col items-center justify-center gap-3 min-h-48">
        <div className="w-10 h-10 rounded-full border-2 border-gray-700 flex items-center justify-center">
          <span className="text-gray-600 text-lg">~</span>
        </div>
        <p className="text-xs text-gray-600 tracking-widest uppercase">No cleared items</p>
        <p className="text-xs text-gray-700">Scan an item, then move to bag zone</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-green-900 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-green-900/30 border-b border-green-900">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-xs text-green-300 tracking-widest uppercase font-bold">
            Cleared Items
          </span>
        </div>
        <span className="text-xs bg-green-800 text-green-200 px-2 py-0.5 rounded-full">
          {clearedItems.length}
        </span>
      </div>

      <div className="divide-y divide-gray-800 max-h-64 overflow-y-auto">
        {clearedItems.map((item) => (
          <div key={item.id} className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-green-900/50 flex items-center justify-center">
                <span className="text-green-400 text-xs">&#10003;</span>
              </div>
              <div>
                <div className="text-sm font-bold text-white capitalize">
                  {item.object_class}
                </div>
                <div className="text-xs text-gray-500">
                  Track #{item.track_id}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-green-400 font-medium">Scanned</div>
              <div className="text-xs text-gray-600">
                {(item.confidence * 100).toFixed(0)}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
