import { createContext, useContext, useEffect, useState, useMemo } from "react";
import io from "socket.io-client";
import { API_URL } from "../config/api";
const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within SocketProvider");
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let socketInstance;
    const connectSocket = () => {
      // Allow connection on all pages for global notifications
      const shouldConnect = true;
      
      if (!shouldConnect) return;

      socketInstance = io(API_URL, {
        transports: ["websocket", "polling"],
        timeout: 5000,
        autoConnect: true,
        reconnection: true, // Enable reconnection
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
      });

      socketInstance.on("connect", () => {
        setIsConnected(true);
        console.log('🔌 Socket Connected');
      });

      socketInstance.on("disconnect", () => {
        setIsConnected(false);
        console.log('🔌 Socket Disconnected');
      });

      socketInstance.on("connect_error", (error) => {
        setIsConnected(false);
        console.log('🔌 Socket Connection Error:', error);
      });

      setSocket(socketInstance);
    };

    connectSocket();

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, []);

  const value = useMemo(() => ({ socket, isConnected }), [socket, isConnected]);

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
