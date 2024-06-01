import { useEffect, useState } from "react";
import useSocket from "../hooks/useSocket";

function IncomingCall() {
  const { socket } = useSocket();
  const [callIncoming, setCallIncoming] = useState(false);

  useEffect(() => {
    socket.on("CALL:INCOMING", (data) => {
      console.log("CALL:INCOMING", data);
      setCallIncoming(data);
    });

    return () => {
      socket.off("CALL:INCOMING");
    };
  }, [socket]);

  if (!callIncoming) return null;

  return (
    <div>
      <h3>Incoming Call</h3>
      <p>From: {callIncoming.fromUser.name}</p>
      <button>Answer Call</button>
      <button>Reject Call</button>
    </div>
  );
}

export default IncomingCall;
