import { useCallback, useEffect, useRef, useState } from "react";
import ReactPlayer from "react-player";
import { useAuth } from "../hooks/useAuth";
import useSocket from "../hooks/useSocket";
import peer from "../lib/peer";
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
  const [currentRoom, setCurrentRoom] = useState(null);
  const stream = useRef(null);
  const remoteStreams = useRef(null);

  const computeRemoteUserId = useCallback(() => {
    console.log("Computing remote user id....");
    const fromUser = currentRoom?.fromUser?.id;
    const targetUser = currentRoom?.targetUser?.id;
    const remoteUserId = fromUser === auth.user.id ? targetUser : fromUser;
    console.log({ fromUser, targetUser, remoteUserId });
    return remoteUserId;
  }, [auth.user.id, currentRoom?.fromUser?.id, currentRoom?.targetUser?.id]);

  const startAudioStream = useCallback(async () => {
    try {
      console.log("Starting my media stream...");
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      stream.current = audioStream;
      return audioStream;
    } catch (error) {
      console.log(error);
      alert("Unable to get device audio!");
      return null;
    }
  }, []);

  const stopAudioStream = useCallback(() => {
    console.log("Stopping my media stream receiver...");
    if (stream.current) {
      stream.current.getTracks().forEach((track) => track.stop());
      stream.current = null;
    }
  }, []);

  const handleStreamTransmit = useCallback(async () => {
    try {
      const audioStream = await startAudioStream();
      if (audioStream) {
        for (const track of audioStream.getTracks()) {
          peer.peer.addTrack(track, audioStream);
        }
      }
    } catch (error) {
      console.log(`----- ~ handleStreamTransmit ~ error:`, error);
    }
  }, [startAudioStream]);

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
    stopAudioStream();
  }, [
    setCallOngoing,
    setCallOutgoing,
    stopAudioStream,
    callOngoing,
    callOutgoing,
    auth.user,
    socket,
  ]);

  const handleNegotiationNeeded = useCallback(async () => {
    console.log("Received negotiation request");
    const offer = await peer.getOffer();
    const remoteUserId = computeRemoteUserId();
    const payload = {
      ...currentRoom,
      offer,
      toUserId: remoteUserId,
    };
    console.log("Sharing my negotiation offer...", payload);
    socket.emit("CALL:NEGOTIATION", payload);
  }, [computeRemoteUserId, currentRoom, socket]);

  const handleIncomingNegotiation = useCallback(
    async (data) => {
      console.log("Received incoming negotiation offer...", data);
      if (!data.offer) {
        console.log("Error: No answer received from the remote user...");
        return;
      }
      const answer = await peer.getAnswer(data.offer);
      const remoteUserId = computeRemoteUserId();
      const payload = {
        ...data,
        answer,
        toUserId: remoteUserId,
      };
      console.log("Sharing my answer to negotiation offer...", payload);
      socket.emit("CALL:NEGOTIATION_ANSWER", payload);
    },
    [computeRemoteUserId, socket]
  );

  const handleNegotiationFinish = useCallback(
    async (data) => {
      console.log("Received remote negotiation answer to finish...", data);
      if (!data.answer) {
        console.log("Error: No answer received from the remote user...");
        return;
      }
      await peer.setLocalDescription(data.answer);
      // setCurrentRoom(data);
      handleStreamTransmit();
    },
    [handleStreamTransmit]
  );

  const handleRemoteStream = useCallback((ev) => {
    console.log("Received remote stream", ev.streams);
    remoteStreams.current = ev.streams;
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
    // socket.on("CALL:FINISH_NEGOTIATION", handleNegotiationFinish);
    return () => {
      socket.off("CALL:ACCEPTED_BY_TARGET", handleCallAccepted);
      socket.off("CALL:STARTED", handleCallStarted);
      socket.off("CALL:LEAVE_ROOM_REQUEST", handleLeaveCallRoom);
      socket.on("CALL:ACCEPT_NEGOTIATION", handleIncomingNegotiation);
      // socket.on("CALL:FINISH_NEGOTIATION", handleNegotiationFinish);
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
    // if (callOngoing || callOutgoing) {
    //   // startAudioStream();
    // } else {
    //   stopAudioStream();
    //   remoteStreams.current = (null);
    // }
    return () => {
      stopAudioStream();
    };
  }, [stopAudioStream]);

  if (!callOngoing && !callOutgoing) return null;
  return (
    <div>
      {stream.current ? (
        <ReactPlayer
          url={stream.current}
          muted
          playing={true}
          height={0}
          width={0}
        />
      ) : null}
      {remoteStreams ? (
        <ReactPlayer
          url={remoteStreams}
          playing
          controls
          height={100}
          width={400}
        />
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
