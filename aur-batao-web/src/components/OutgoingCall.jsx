/* eslint-disable react/prop-types */

import { useCallback, useEffect } from "react";
import useSocket from "../hooks/useSocket";

function OutgoingCallScreen() {
  const { socket, callOutgoing, setCallOutgoing } = useSocket();

  const handleEndCall = useCallback(() => {
    socket.emit("CALL:CANCEL", callOutgoing);
    setCallOutgoing(null);
  }, [setCallOutgoing, socket, callOutgoing]);

  const handleCallRejected = useCallback(
    (data) => {
      console.log("Call rejected by target user", data);
      setCallOutgoing(null);
    },
    [setCallOutgoing]
  );

  useEffect(() => {
    // {roomId,fromUser,targetUser,offer,answer,createdAt,status,}
    socket.on("CALL:REJECTED_BY_TARGET", handleCallRejected);

    return () => {
      socket.off("CALL:REJECTED_BY_TARGET", handleCallRejected);
    };
  }, [handleCallRejected, socket]);

  if (!callOutgoing) return null;

  return (
    <div>
      <h3>Outgoing Call</h3>
      <p>To: {callOutgoing.name}</p>
      <button onClick={handleEndCall}>End Call</button>
    </div>
  );
}

export default OutgoingCallScreen;
