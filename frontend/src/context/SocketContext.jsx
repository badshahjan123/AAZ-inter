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
      socketInstance = io(API_URL, {
        transports: ["websocket", "polling"],
        timeout: 5000,
        autoConnect: true,
        reconnection: false,
      });

      socketInstance.on("connect", () => {
        setIsConnected(true);
      });

      socketInstance.on("disconnect", () => {
        setIsConnected(false);
      });

      socketInstance.on("connect_error", () => {
        setIsConnected(false);
      });

      setSocket(socketInstance);
    };

    const timer = setTimeout(connectSocket, 1000);

    return () => {
      clearTimeout(timer);
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
