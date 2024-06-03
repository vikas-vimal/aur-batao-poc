import { useCallback, useEffect, useState } from "react";
import useSocket from "../hooks/useSocket";
import peer from "../lib/peer";

function IncomingCallScreen() {
  const { socket, callIncoming, setCallIncoming, setCallOngoing } = useSocket();
  const [incomingOffer, setIncomingOffer] = useState(null);

  const handleCallAcceptAction = useCallback(async () => {
    if (incomingOffer) {
      console.log("incoming call offer", incomingOffer);
      const answer = await peer.getAnswer(incomingOffer.offer);
      console.log(`---- ~ handleCallAcceptAction ~ answer:`, answer);
      const payload = { ...incomingOffer, answer };
      socket.emit("CALL:ACCEPTED", payload);
      setCallOngoing(payload);
      setCallIncoming(null);
    }
  }, [incomingOffer, setCallIncoming, setCallOngoing, socket]);

  const handleCallRejectAction = useCallback(() => {
    setCallIncoming(null);
    setIncomingOffer(null);
    socket.emit("CALL:REJECT", { ...incomingOffer });
  }, [incomingOffer, setCallIncoming, socket]);

  const handleIncomingCall = useCallback(
    (data) => {
      // const { roomId, fromUser, targetUser, offer, createdAt, status } = data;
      console.log("CALL:INCOMING", data);
      setCallIncoming(data);
      setIncomingOffer(data);
    },
    [setCallIncoming]
  );

  useEffect(() => {
    socket.on("CALL:INCOMING", handleIncomingCall);
    return () => {
      socket.off("CALL:INCOMING", handleIncomingCall);
    };
  }, [handleIncomingCall, socket]);

  if (!callIncoming) return null;
  return (
    <div>
      <h3>Incoming Call</h3>
      <p>From: {callIncoming.fromUser.name}</p>
      <button onClick={handleCallAcceptAction}>Answer Call</button>
      <button onClick={handleCallRejectAction}>Reject Call</button>
    </div>
  );
}

export default IncomingCallScreen;
