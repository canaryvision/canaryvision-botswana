import { useEffect, useRef, useState } from "react";

// Define the type for the WebSocket data. Adjust this based on the structure of the data.
interface WebSocketData {
  status: string;
  count: number;
  alerts: string[]; 
}

export function useWebSocket(url: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const [data, setData] = useState<WebSocketData | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    // Establish WebSocket connection
    wsRef.current = new WebSocket(url);

    wsRef.current.onopen = () => {
      console.log("WebSocket connected");
      setIsConnected(true);
    };

    wsRef.current.onmessage = (message: MessageEvent) => {
      try {
        const parsed: WebSocketData = JSON.parse(message.data);
        setData(parsed);
      } catch (err) {
        console.error("Invalid JSON from WS:", err);
      }
    };

    wsRef.current.onclose = () => {
      console.log("WebSocket closed");
      setIsConnected(false);
    };

    wsRef.current.onerror = (err: Event) => {
      console.error("WebSocket error:", err);
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [url]);

  return { data, isConnected };
}
