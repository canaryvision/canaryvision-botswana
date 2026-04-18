import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

// Define the type for the WebSocket data.
interface WebSocketData {
  status: string;
  count: number;
  alerts: string[];
}

// Create the WebSocket context with default value of `undefined`
const WebSocketContext = createContext<
  | {
      data: WebSocketData | null;
      isConnected: boolean;
    }
  | undefined
>(undefined);

interface WebSocketProviderProps {
  children: React.ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  children,
}) => {
  const wsRef = useRef<WebSocket | null>(null);
  const [data, setData] = useState<WebSocketData | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false); 

  // Initialize WebSocket connection
  // useEffect(() => {
  //   wsRef.current = new WebSocket("ws://192.168.1.42:8766/canary-track");

  //   wsRef.current.onopen = () => {
  //     console.log("WebSocket connected");
  //     setIsConnected(true);
  //   };

  //   wsRef.current.onmessage = (message: MessageEvent) => {
  //     try {
  //       const parsed: WebSocketData = JSON.parse(message.data);
  //       setData(parsed);
  //       console.log("WebSocket message: kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk", parsed);
  //     } catch (err) {
  //       console.error("Invalid JSON from WS:", err);
  //     }
  //   };

  //   wsRef.current.onclose = () => {
  //     console.log("WebSocket closed");
  //     setIsConnected(false);
  //   };

  //   wsRef.current.onerror = (err: Event) => {
  //     console.error("WebSocket error:", err);
  //   };

  //   return () => {
  //     if (wsRef.current) {
  //       wsRef.current.close();
  //     }
  //   };
  // }, []);

  useEffect(() => {
    // 🚫 Stop WS in demo mode
    if (import.meta.env.VITE_ENABLE_WS !== "true") {
      console.log("WebSocket disabled (demo mode)");
      return;
    }

    wsRef.current = new WebSocket("ws://192.168.1.42:8766/canary-track");

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
  }, []);

  return (
    <WebSocketContext.Provider value={{ data, isConnected }}>
      {children}
    </WebSocketContext.Provider>
  );
};

// Custom hook to use WebSocket data anywhere in the app
export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
};
