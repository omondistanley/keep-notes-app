import { useEffect, useRef, useState } from "react";

/**
 * One WebSocket per URL for the whole app. Created once, never closed by the hook
 * (so remounts don't cause connect/disconnect). The hook only wires the latest
 * onMessage via a ref.
 */
const shared = new Map();

function getConnection(url, messageHandlerRef, setConnected) {
  let c = shared.get(url);
  if (c) {
    c.messageHandlerRef = messageHandlerRef;
    c.setConnected = setConnected;
    if (c.ws && c.ws.readyState === WebSocket.OPEN && setConnected) setConnected(true);
    return c;
  }

  const ws = new WebSocket(url);
  c = {
    ws,
    messageHandlerRef: null,
    setConnected: null
  };
  shared.set(url, c);

  ws.onopen = () => {
    ws.send(JSON.stringify({ type: "subscribe" }));
    if (c.setConnected) c.setConnected(true);
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === "note_update" && c.messageHandlerRef?.current) {
        c.messageHandlerRef.current(data);
      }
    } catch (_) {}
  };

  ws.onerror = (err) => {
    console.error("WebSocket error:", err);
  };

  ws.onclose = () => {
    if (c.setConnected) c.setConnected(false);
  };

  c.messageHandlerRef = messageHandlerRef;
  c.setConnected = setConnected;
  return c;
}

const useWebSocket = (url, onMessage) => {
  const [isConnected, setIsConnected] = useState(false);
  const handlerRef = useRef(onMessage);
  handlerRef.current = onMessage;

  useEffect(() => {
    if (!url) return;
    const c = getConnection(url, handlerRef, setIsConnected);
    if (c.ws.readyState === WebSocket.OPEN) setIsConnected(true);
    return () => {
      c.messageHandlerRef = null;
      c.setConnected = null;
    };
  }, [url]);

  return { isConnected };
};

export default useWebSocket;
