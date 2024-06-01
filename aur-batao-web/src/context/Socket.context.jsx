import { createContext, useEffect, useMemo, useState } from "react";
import { io as socketIO } from "socket.io-client";
import { useAuth } from "../hooks/useAuth";

export const SocketContext = createContext({
  socket: null,
  connected: false,
});

// eslint-disable-next-line react/prop-types
export const SocketProvider = ({ children }) => {
  const socketInstance = useMemo(() => socketIO("http://localhost:6080"), []);
  const [connected, setConnected] = useState(false);
  const auth = useAuth();

  useEffect(() => {
    socketInstance.on("connect", () => {
      console.log("socket connected...");
      setConnected(true);
      socketInstance.emit("USER:ONLINE", { user: auth.user });
    });
    socketInstance.on("disconnect", () => {
      console.log("socket disconnected...");
      setConnected(false);
    });

    // return () => {
    //   socketInstance.disconnect();
    // };
  }, [auth.user.id, auth.user, socketInstance, socketInstance.connected]);

  useEffect(() => {
    socketInstance.emit("USER:ONLINE", { user: auth.user });
  }, [auth.user.id, auth.user, socketInstance]);

  return (
    <SocketContext.Provider value={{ socket: socketInstance, connected }}>
      {children}
    </SocketContext.Provider>
  );
};
