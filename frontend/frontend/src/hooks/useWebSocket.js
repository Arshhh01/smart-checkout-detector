import { useState, useEffect, useRef, useCallback } from "react";

export default function useWebSocket(url) {
  const [lastMessage, setLastMessage] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);
  const shouldReconnect = useRef(true);

  const connect = useCallback(() => {
    if (!url) return;

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connected:", url);
        setIsConnected(true);
        // Clear any pending reconnect timer
        if (reconnectTimer.current) {
          clearTimeout(reconnectTimer.current);
          reconnectTimer.current = null;
        }
      };

      ws.onmessage = (event) => {
        setLastMessage(event.data);
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected");
        setIsConnected(false);
        wsRef.current = null;

        // Auto-reconnect after 2 seconds
        if (shouldReconnect.current) {
          console.log("Reconnecting in 2s...");
          reconnectTimer.current = setTimeout(connect, 2000);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        ws.close();
      };
    } catch (err) {
      console.error("WebSocket connection failed:", err);
      // Retry after 2s
      if (shouldReconnect.current) {
        reconnectTimer.current = setTimeout(connect, 2000);
      }
    }
  }, [url]);

  useEffect(() => {
    shouldReconnect.current = true;
    connect();

    return () => {
      shouldReconnect.current = false;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connect]);

  return { lastMessage, isConnected };
}
