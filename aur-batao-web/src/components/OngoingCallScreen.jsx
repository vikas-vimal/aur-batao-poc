import { useCallback, useEffect, useRef } from "react";
import useSocket from "../hooks/useSocket";

function OngoingCallScreen() {
  const { socket, callOngoing, callOutgoing } = useSocket();
  const timerRef = useRef(null);
  const localAudioRef = useRef(null);

  console.log({ callOngoing });

  const handleCallAccepted = useCallback((data) => {
    console.log("Call accepted by target user", data);
  }, []);

  useEffect(() => {
    // {roomId,fromUser,targetUser,offer,answer,createdAt,status,}
    socket.on("CALL:ACCEPTED_BY_TARGET", handleCallAccepted);

    return () => {
      socket.off("CALL:ACCEPTED_BY_TARGET", handleCallAccepted);
    };
  }, [handleCallAccepted, socket]);

  useEffect(() => {
    if (callOngoing || callOutgoing) {
      navigator.mediaDevices
        .getUserMedia({
          audio: true,
        })
        .then((stream) => {
          if (localAudioRef.current) {
            localAudioRef.current.srcObject = stream;
          }
          // stream.getTracks().forEach(track=>)
        })
        .catch((err) => {
          console.log(err);
          alert("Unable to get device audio!");
        });
    }
  }, [callOngoing, callOutgoing]);

  if (!callOngoing && !callOutgoing) return null;
  return (
    <div>
      {/* <h3>Connected Call</h3> */}
      <audio ref={localAudioRef} muted autoPlay />

      {/* <p>With: {callIncoming?.name}</p> */}
      {/* <button>Answer Call</button> */}
      {/* <button>End Call</button> */}
    </div>
  );
}

export default OngoingCallScreen;
