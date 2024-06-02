import { useEffect, useRef } from "react";
import useSocket from "../hooks/useSocket";

function OngoingCallScreen() {
  const { callOngoing, callOutgoing } = useSocket();
  const timerRef = useRef(null);
  const localAudioRef = useRef(null);

  console.log({ callOngoing });

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
      <h3>Connected Call</h3>
      <audio ref={localAudioRef} muted autoPlay />

      {/* <p>With: {callIncoming?.name}</p> */}
      {/* <button>Answer Call</button> */}
      <button>End Call</button>
    </div>
  );
}

export default OngoingCallScreen;
