import { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { api, API_URL } from '../config/api';
const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Check if backend is running before connecting
    const checkBackend = async () => {
      try {
        const response = await fetch(api('/api/categories'), { 
          method: 'HEAD',
          signal: AbortSignal.timeout(2000)
        });
        return response.ok;
      } catch {
        return false;
      }
    };

    const connectSocket = async () => {
      const backendRunning = await checkBackend();
      if (!backendRunning) {
        console.log('Backend not running - skipping socket connection');
        return;
      }

      const backendUrl = API_URL;
      const socketInstance = io(backendUrl, {
        transports: ['websocket', 'polling'],
        timeout: 5000,
        autoConnect: true
      });

      socketInstance.on('connect', () => {
        console.log('✅ Socket connected:', socketInstance.id);
        setIsConnected(true);
      });

      socketInstance.on('disconnect', () => {
        setIsConnected(false);
      });

      socketInstance.on('connect_error', () => {
        setIsConnected(false);
      });

      setSocket(socketInstance);
      return socketInstance;
    };

    let socketInstance;
    connectSocket().then(instance => {
      socketInstance = instance;
    });

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
