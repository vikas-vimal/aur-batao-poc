import { createContext, useEffect, useMemo, useState } from "react";
import { io as socketIO } from "socket.io-client";
import { useAuth } from "../hooks/useAuth";

export const SocketContext = createContext({
  socket: null,
  connected: false,
  callIncoming: null,
  setCallIncoming: () => {},
  callOutgoing: null,
  setCallOutgoing: () => {},
});

// eslint-disable-next-line react/prop-types
export const SocketProvider = ({ children }) => {
  const auth = useAuth();
  const socketInstance = useMemo(() => socketIO("http://localhost:6080"), []);
  const [connected, setConnected] = useState(false);
  const [callIncoming, setCallIncoming] = useState(null);
  const [callOutgoing, setCallOutgoing] = useState(null);

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

  useEffect(() => {
    socketInstance.on("CALL:INCOMING", (data) => {
      console.log("CALL:INCOMING", data);
      setCallIncoming(data);
    });
    socketInstance.on("CALL:ENDED", (data) => {
      console.log("CALL:ENDED", data);
      setCallIncoming(null);
      setCallOutgoing(null);
    });

    return () => {
      socketInstance.off("CALL:INCOMING");
      socketInstance.off("CALL:ENDED");
    };
  }, [socketInstance]);

  return (
    <SocketContext.Provider
      value={{
        socket: socketInstance,
        connected,
        callIncoming,
        setCallIncoming,
        callOutgoing,
        setCallOutgoing,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
