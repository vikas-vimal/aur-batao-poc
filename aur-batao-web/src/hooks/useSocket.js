import React, { useContext } from "react";
import { SocketContext } from "../context/Socket.context";

export const useSocket = () => {
  const socket = useContext(SocketContext);
  return socket;
};

export default useSocket;
