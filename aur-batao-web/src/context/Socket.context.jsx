import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { io as socketIO } from "socket.io-client";
import { useAuth } from "../hooks/useAuth";

export const SocketContext = createContext({
  socket: null,
  connected: false,
  callIncoming: null,
  setCallIncoming: () => {},
  callOutgoing: null,
  setCallOutgoing: () => {},
  callOngoing: null,
  setCallOngoing: () => {},
});

// eslint-disable-next-line react/prop-types
export const SocketProvider = ({ children }) => {
  const auth = useAuth();
  const socketInstance = useMemo(() => socketIO("http://localhost:6080"), []);
  const [connected, setConnected] = useState(false);
  const [callIncoming, setCallIncoming] = useState(null);
  const [callOutgoing, setCallOutgoing] = useState(null);
  const [callOngoing, setCallOngoing] = useState(null);

  const callEndedHandler = useCallback((data) => {
    console.log("CALL:ENDED", data);
    setCallIncoming(null);
    setCallOutgoing(null);
  }, []);

  useEffect(() => {
    socketInstance.on("connect", () => {
      console.log("socket connected...", socketInstance.id);
      setConnected(true);
      socketInstance.emit("USER:ONLINE", { user: auth.user });
    });
    return () => {
      socketInstance.disconnect();
    };
  }, [auth.user.id, auth.user, socketInstance, socketInstance.connected]);

  useEffect(() => {
    socketInstance.on("disconnect", () => {
      console.log("socket disconnected...");
      setConnected(false);
    });
  }, [socketInstance]);

  useEffect(() => {
    socketInstance.emit("USER:ONLINE", { user: auth.user });
  }, [auth.user.id, auth.user, socketInstance]);

  useEffect(() => {
    socketInstance.on("CALL:ENDED", callEndedHandler);

    return () => {
      socketInstance.off("CALL:ENDED", callEndedHandler);
    };
  }, [callEndedHandler, socketInstance]);

  return (
    <SocketContext.Provider
      value={{
        socket: socketInstance,
        connected,
        callIncoming,
        setCallIncoming,
        callOutgoing,
        setCallOutgoing,
        callOngoing,
        setCallOngoing,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
