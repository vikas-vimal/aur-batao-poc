/* eslint-disable react/prop-types */

import { useCallback } from "react";
import useSocket from "../hooks/useSocket";
import { useAuth } from "../hooks/useAuth";

function OutgoingCallScreen() {
  const { socket, callOutgoing, setCallOutgoing } = useSocket();
  const auth = useAuth();

  const handleEndCall = useCallback(() => {
    socket.emit("CALL:END", { sourceUser: auth.user, targetUserId: callOutgoing.id });
    setCallOutgoing(null);
  }, [auth.user, setCallOutgoing, socket, callOutgoing]);

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
