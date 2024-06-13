import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  const [remoteStreams, setRemoteStreams] = useState(null);

  const remoteUserId = useMemo(() => {
    if (!currentRoom) return null;
    return currentRoom.fromUser?.id === auth.user.id
      ? currentRoom.fromUser.id
      : currentRoom.targetUser.id;
  }, [auth.user.id, currentRoom]);

  const handleStreamTransmit = useCallback(async () => {
    try {
      if (!stream) {
        const st = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        console.log("Accessed stream...");
        setStream(st);
        for (const track of st.getTracks()) {
          peer.peer.addTrack(track, st);
        }
        if (localAudioRef.current) {
          localAudioRef.current.srcObject = st;
        }
      } else {
        for (const track of stream.getTracks()) {
          peer.peer.addTrack(track, stream);
        }
      }
    } catch (error) {
      console.log(`----- ~ handleStreamTransmit ~ error:`, error);
      alert("Unable to get device audio!");
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
  }, [
    callOngoing,
    callOutgoing,
    socket,
    auth.user,
    setCallOngoing,
    setCallOutgoing,
  ]);

  const handleNegotiationNeeded = useCallback(async () => {
    console.log("Received negotiation request");
    const offer = await peer.getOffer();
    const payload = {
      ...currentRoom,
      offer,
      toUserId: remoteUserId,
    };
    console.log("Sharing my negotiation offer...", payload);
    socket.emit("CALL:NEGOTIATION", payload);
  }, [currentRoom, remoteUserId, socket]);

  const handleIncomingNegotiation = useCallback(
    async (data) => {
      console.log("Received incoming negotiation offer...", data);
      if (!data.offer) {
        console.log("Error: No answer received from the remote user...");
        return;
      }
      const answer = await peer.getAnswer(data.offer);
      const payload = {
        ...data,
        answer,
        toUserId: remoteUserId,
      };
      console.log("Sharing my answer to negotiation offer...", payload);
      socket.emit("CALL:NEGOTIATION_ANSWER", payload);
    },
    [remoteUserId, socket]
  );

  const handleNegotiationFinish = useCallback(
    async (data) => {
      console.log("Received remote negotiation answer to finish...", data);
      if (!data.answer) {
        console.log("Error: No answer received from the remote user...");
        return;
      }
      await peer.setLocalDescription(data.answer);
      setCurrentRoom(data);
      handleStreamTransmit();
    },
    [handleStreamTransmit]
  );

  const handleRemoteStream = useCallback((ev) => {
    console.log("Received remote stream", ev.streams);
    setRemoteStreams(ev.streams);
  }, []);

  useEffect(() => {
    peer.peer.addEventListener("negotiationneeded", handleNegotiationNeeded);
    return () => {
      peer.peer.removeEventListener(
        "negotiationneeded",
        handleNegotiationNeeded
      );
    };
  }, [handleNegotiationNeeded]);

  useEffect(() => {
    peer.peer.addEventListener("track", handleRemoteStream);
    return () => {
      peer.peer.removeEventListener("track", handleRemoteStream);
    };
  }, [handleRemoteStream]);

  useEffect(() => {
    // {roomId,fromUser,targetUser,offer,answer,createdAt,status,}
    socket.on("CALL:ACCEPTED_BY_TARGET", handleCallAccepted);
    socket.on("CALL:STARTED", handleCallStarted);
    socket.on("CALL:LEAVE_ROOM_REQUEST", handleLeaveCallRoom);
    socket.on("CALL:ACCEPT_NEGOTIATION", handleIncomingNegotiation);
    socket.on("CALL:FINISH_NEGOTIATION", handleNegotiationFinish);
    return () => {
      socket.off("CALL:ACCEPTED_BY_TARGET", handleCallAccepted);
      socket.off("CALL:STARTED", handleCallStarted);
      socket.off("CALL:LEAVE_ROOM_REQUEST", handleLeaveCallRoom);
      socket.on("CALL:ACCEPT_NEGOTIATION", handleIncomingNegotiation);
      socket.on("CALL:FINISH_NEGOTIATION", handleNegotiationFinish);
    };
  }, [
    handleCallAccepted,
    handleCallStarted,
    handleIncomingNegotiation,
    handleLeaveCallRoom,
    handleNegotiationFinish,
    socket,
  ]);

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
        setStream(null);
        setRemoteStreams(null);
      }
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [callOngoing, callOutgoing, stream]);

  if (!callOngoing && !callOutgoing) return null;
  return (
    <div>
      <audio src={stream} autoPlay />
      {remoteStreams ? (
        <audio src={remoteStreams?.[0]} autoPlay controls />
      ) : (
        <div>no remote stream</div>
      )}
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
