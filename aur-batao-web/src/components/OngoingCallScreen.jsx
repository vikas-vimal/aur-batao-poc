import { useCallback, useEffect, useRef, useState } from "react";
import useSocket from "../hooks/useSocket";
import peer from "../lib/peer";
import { useAuth } from "../hooks/useAuth";
import CallTimerComponent from "./CallTimer";

function OngoingCallScreen() {
  const auth = useAuth();
  const {
    socket,
    callOngoing,
    callOutgoing,
    setCallOngoing,
    setCallOutgoing,
    setCallIncoming,
  } = useSocket();
  const localAudioRef = useRef(null);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [stream, setStream] = useState(null);

  const handleStreamTransmit = useCallback(() => {
    if (!stream) return;
    for (const track of stream) {
      peer.peer.addTrack(track);
    }
  }, [stream]);

  const handleCallAccepted = useCallback(async (data) => {
    console.log("Call accepted by target user", data);
    await peer.setLocalDescription(data.answer);
  }, []);

  const handleCallStarted = useCallback(
    async (data) => {
      console.log("✅ Call started in the room", data);
      setCurrentRoom(data);
      setCallOngoing(data);
      setCallOutgoing(null);
      setCallIncoming(null);
      handleStreamTransmit();
    },
    [handleStreamTransmit, setCallIncoming, setCallOngoing, setCallOutgoing]
  );

  const handleEndCall = useCallback(() => {
    console.log("Ending call with room data", currentRoom);
    socket.emit("CALL:END", currentRoom);
  }, [socket, currentRoom]);

  const handleLeaveCallRoom = useCallback(() => {
    setCallOngoing(null);
    setCallOutgoing(null);
    setCurrentRoom((preVal) => {
      console.log("Leaving room call with room data", {
        currentRoom: preVal,
        callOngoing,
        callOutgoing,
      });
      const payload = {
        ...preVal,
        endedByUser: auth.user,
      };
      socket.emit("CALL:LEAVE_ROOM", payload);
      return null;
    });
  }, [callOngoing, callOutgoing, socket, auth.user, setCallOngoing, setCallOutgoing]);

  useEffect(() => {
    // {roomId,fromUser,targetUser,offer,answer,createdAt,status,}
    socket.on("CALL:ACCEPTED_BY_TARGET", handleCallAccepted);
    socket.on("CALL:STARTED", handleCallStarted);
    socket.on("CALL:LEAVE_ROOM_REQUEST", handleLeaveCallRoom);
    return () => {
      socket.off("CALL:ACCEPTED_BY_TARGET", handleCallAccepted);
      socket.off("CALL:STARTED", handleCallStarted);
      socket.off("CALL:LEAVE_ROOM_REQUEST", handleLeaveCallRoom);
    };
  }, [handleCallAccepted, handleCallStarted, handleLeaveCallRoom, socket]);

  useEffect(() => {
    if (callOngoing || callOutgoing) {
      navigator.mediaDevices
        .getUserMedia({
          audio: true,
        })
        .then((stream) => {
          setStream(stream);
          if (localAudioRef.current) {
            localAudioRef.current.srcObject = stream;
          }
          // stream.getTracks().forEach(track=>)
        })
        .catch((err) => {
          console.log(err);
          alert("Unable to get device audio!");
        });
    } else {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    }
  }, [callOngoing, callOutgoing, stream]);

  if (!callOngoing && !callOutgoing) return null;
  return (
    <div>
      <audio src={stream} muted autoPlay />
      {callOngoing ? (
        <>
          <h3 style={{ marginBottom: 0 }}>Connected Call</h3>
          <CallTimerComponent />
          {/* <p>With: {callIncoming?.name}</p> */}
          {/* <button>Answer Call</button> */}
          <button onClick={handleEndCall}>End Call</button>
        </>
      ) : null}
    </div>
  );
}

export default OngoingCallScreen;
