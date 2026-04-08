import { useMemo } from "react";

const MOCK_PRICES = {
  "cell phone": 29.99, bottle: 2.49, cup: 4.99, bowl: 6.99, book: 14.99,
  laptop: 49.99, mouse: 12.99, keyboard: 19.99, scissors: 7.99, toothbrush: 3.49,
  "hair drier": 24.99, apple: 1.29, orange: 1.49, banana: 0.59, sandwich: 6.99,
  cake: 24.99, donut: 2.99, "wine glass": 8.99, fork: 2.99, knife: 3.99,
  spoon: 2.99, can: 1.99, backpack: 19.99, handbag: 24.99, suitcase: 39.99, umbrella: 9.99,
};

function getPrice(cls) { return MOCK_PRICES[cls?.toLowerCase().trim()] ?? 9.99; }

export default function POSPanel({ clearedItems, activeThefts }) {
  const lineItems = useMemo(() => clearedItems.map((item) => ({
    id: item.id, name: item.object_class, track_id: item.track_id, price: getPrice(item.object_class), status: "scanned",
  })), [clearedItems]);

  const theftItems = useMemo(() => activeThefts.map((t) => ({
    id: t.id, name: t.object_class, track_id: t.track_id, price: getPrice(t.object_class), status: "unscanned",
  })), [activeThefts]);

  const allItems = [...lineItems, ...theftItems];
  const subtotal = lineItems.reduce((sum, item) => sum + item.price, 0);
  const tax = subtotal * 0.0625;
  const total = subtotal + tax;
  const lostRevenue = theftItems.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="bg-surface-1 rounded-lg overflow-hidden">
      <div className="px-3 py-2 flex items-center justify-between border-b border-line">
        <span className="text-xs text-txt-muted">Receipt</span>
        <span className="text-xs text-txt-muted font-mono">{new Date().toLocaleDateString()}</span>
      </div>

      <div className="divide-y divide-line">
        {allItems.length === 0 ? (
          <div className="p-3 text-center text-xs text-txt-muted">No items</div>
        ) : (
          allItems.map((item) => (
            <div key={item.id} className={`px-3 py-1.5 flex items-center justify-between ${item.status === "unscanned" ? "bg-accent-red/5" : ""}`}>
              <div className="flex items-center gap-2">
                {item.status === "unscanned" && <span className="text-accent-red text-xs">!</span>}
                <span className="text-sm capitalize">{item.name}</span>
                <span className="text-xs text-txt-muted font-mono">#{item.track_id}</span>
              </div>
              {item.status === "unscanned" ? (
                <span className="text-xs text-accent-red font-mono">not scanned</span>
              ) : (
                <span className="text-sm font-mono">${item.price.toFixed(2)}</span>
              )}
            </div>
          ))
        )}
      </div>

      {lineItems.length > 0 && (
        <div className="border-t border-line px-3 py-2 space-y-1">
          <div className="flex justify-between text-xs text-txt-muted">
            <span>Subtotal</span><span className="font-mono">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs text-txt-muted">
            <span>Tax 6.25%</span><span className="font-mono">${tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm font-medium pt-1 border-t border-line">
            <span>Total</span><span className="font-mono">${total.toFixed(2)}</span>
          </div>
        </div>
      )}

      {theftItems.length > 0 && (
        <div className="border-t border-line px-3 py-2 bg-accent-red/5 flex justify-between">
          <span className="text-xs text-accent-red">Potential loss</span>
          <span className="text-sm text-accent-red font-mono font-medium">${lostRevenue.toFixed(2)}</span>
        </div>
      )}
    </div>
  );
}