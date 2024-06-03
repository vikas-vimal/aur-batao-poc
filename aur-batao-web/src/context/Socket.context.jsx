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

  const connectedHandler = useCallback(() => {
    console.log("socket connected...", socketInstance.id);
    setConnected(true);
    socketInstance.emit("USER:ONLINE", { user: auth.user });
  }, [auth.user, socketInstance]);

  const disconnectHandler = useCallback(() => {
    console.log("socket disconnected...");
    setConnected(false);
  }, []);

  const callCancelledHandler = useCallback((data) => {
    console.log("CALL:CANCELLED", data);
    setCallIncoming(null);
    setCallOutgoing(null);
  }, []);

  const handleAccountUpdate = useCallback(
    (data) => {
      console.log("Received new details for account...", data);
      console.log("Updating account details...");
      auth.setUser(data);
    },
    [auth]
  );

  useEffect(() => {
    socketInstance.on("connect", connectedHandler);
    socketInstance.on("disconnect", disconnectHandler);
    socketInstance.on("CALL:CANCELLED", callCancelledHandler);
    socketInstance.on("ACCOUNT:UPDATE_BALANCE", handleAccountUpdate);
    return () => {
      socketInstance.off("connect", connectedHandler);
      socketInstance.off("disconnect", disconnectHandler);
      socketInstance.off("CALL:CANCELLED", callCancelledHandler);
      socketInstance.off("ACCOUNT:UPDATE_BALANCE", handleAccountUpdate);
    };
  }, [
    auth.user.id,
    auth.user,
    socketInstance,
    socketInstance.connected,
    connectedHandler,
    disconnectHandler,
    callCancelledHandler,
  ]);

  useEffect(() => {
    if (connected) {
      socketInstance.emit("USER:ONLINE", { user: auth.user });
    }
  }, [auth.user.id, auth.user, socketInstance, connected]);

  useEffect(() => {
    socketInstance.disconnect();
    socketInstance.connect();
  }, [auth.user.id, auth.user, socketInstance]);

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
