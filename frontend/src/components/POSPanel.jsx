import { useMemo } from "react";

const MOCK_PRICES = {
  "cell phone": 999.99,
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

export default function POSPanel({ clearedItems, activeThefts }) {
  const lineItems = useMemo(() => {
    return clearedItems.map((item) => ({
      id: item.id,
      name: item.object_class,
      track_id: item.track_id,
      price: getPrice(item.object_class),
      status: "scanned",
    }));
  }, [clearedItems]);

  const theftItems = useMemo(() => {
    return activeThefts.map((t) => ({
      id: t.id,
      name: t.object_class,
      track_id: t.track_id,
      price: getPrice(t.object_class),
      status: "unscanned",
    }));
  }, [activeThefts]);

  const allItems = [...lineItems, ...theftItems];
  const subtotal = lineItems.reduce((sum, item) => sum + item.price, 0);
  const tax = subtotal * 0.0625;
  const total = subtotal + tax;
  const lostRevenue = theftItems.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 tracking-widest uppercase font-bold">
            POS Receipt
          </span>
        </div>
        <span className="text-xs text-gray-600">
          {new Date().toLocaleDateString()}
        </span>
      </div>

      {/* Store info */}
      <div className="px-4 py-2 border-b border-gray-800 text-center">
        <div className="text-xs text-gray-500">Smart Checkout Store</div>
        <div className="text-xs text-gray-600">Station #1 · Cam_0</div>
      </div>

      {/* Line items */}
      <div className="divide-y divide-gray-800/50 max-h-52 overflow-y-auto">
        {allItems.length === 0 ? (
          <div className="p-4 text-center text-gray-600 text-xs">
            No items scanned yet
          </div>
        ) : (
          allItems.map((item) => (
            <div
              key={item.id}
              className={`px-4 py-2 flex items-center justify-between ${
                item.status === "unscanned" ? "bg-red-950/30" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                {item.status === "unscanned" && (
                  <span className="text-red-500 text-xs">✕</span>
                )}
                <div>
                  <span className="text-sm text-white capitalize">{item.name}</span>
                  <span className="text-xs text-gray-600 ml-1.5">#{item.track_id}</span>
                </div>
              </div>
              <div className="text-right">
                {item.status === "unscanned" ? (
                  <span className="text-xs text-red-400 font-medium">NOT SCANNED</span>
                ) : (
                  <span className="text-sm text-white">${item.price.toFixed(2)}</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Totals */}
      {lineItems.length > 0 && (
        <div className="border-t border-gray-700 px-4 py-3 space-y-1.5">
          <div className="flex justify-between text-xs text-gray-400">
            <span>Subtotal ({lineItems.length} item{lineItems.length !== 1 ? "s" : ""})</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>Tax (6.25%)</span>
            <span>${tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm font-bold text-white pt-1 border-t border-gray-700">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Lost revenue warning */}
      {theftItems.length > 0 && (
        <div className="border-t border-red-900 px-4 py-2.5 bg-red-950/40 flex justify-between items-center">
          <span className="text-xs text-red-400 font-medium">Potential lost revenue</span>
          <span className="text-sm text-red-400 font-bold">${lostRevenue.toFixed(2)}</span>
        </div>
      )}
    </div>
  );
}
