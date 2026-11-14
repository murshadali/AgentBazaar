import React, { createContext, useContext, useEffect, useState } from 'react';
import { getSocket } from '../services/socket';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const s = getSocket();
    setSocket(s);

    return () => {
      // Keep socket open across SPA navigation
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
