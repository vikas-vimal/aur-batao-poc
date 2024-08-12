import { useState, useEffect, useCallback } from "react";
import io from "socket.io-client";
import Peer from "peerjs";

const SERVER_URL = "http://localhost:3000";

function App() {
  const [socket, setSocket] = useState(null);
  const [peer, setPeer] = useState(null);
  const [myId, setMyId] = useState("");
  const [users, setUsers] = useState([]);
  const [credits, setCredits] = useState(0);
  const [currentCall, setCurrentCall] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [callEndedMessage, setCallEndedMessage] = useState(null);

  const fetchUsers = useCallback(async () => {
    const response = await fetch(`${SERVER_URL}/users`);
    const data = await response.json();
    setUsers(data.filter((user) => user.id !== myId));
    console.log({ data });
  }, [myId]);

  const fetchCredits = useCallback(async (myId) => {
    const response = await fetch(`${SERVER_URL}/check-credits/${myId}`);
    const data = await response.json();
    setCredits(data.credits);
  }, []);

  const startCall = useCallback(
    (calleeId) => {
      const call = peer.call(calleeId, new MediaStream());
      setCurrentCall({ calleeId });

      call.on("stream", (remoteStream) => {
        // Handle remote stream (e.g., play audio)
        console.log(remoteStream);
      });
    },
    [peer]
  );

  const handleCall = (calleeId) => {
    socket.emit("call-user", { callerId: myId, calleeId });
  };

  const acceptCall = () => {
    if (incomingCall) {
      socket.emit("call-accepted", {
        callerId: incomingCall.callerId,
        calleeId: myId,
      });
      setCurrentCall({ calleeId: incomingCall.callerId });
      setIncomingCall(null);
    }
  };

  const endCall = () => {
    if (currentCall) {
      socket.emit("call-ended", { callerId: myId });
      setCurrentCall(null);
    }
  };

  const handleAddCredits = useCallback(
    async (credits = 10) => {
      const headers = new Headers();
      headers.set("Content-Type", "application/json");
      const response = await fetch(`${SERVER_URL}/add-credits`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          userId: myId,
          credits,
        }),
      });
      const result = await response.json();
      console.log("Add credit result", result);
      setCredits((prev) => prev + +result.newBalance || 0);
    },
    [myId]
  );

  useEffect(() => {
    const newSocket = io(SERVER_URL);
    const newPeer = new Peer(undefined, {
      host: "/",
      port: "3000",
      path: "/peerjs/myapp",
    });

    newSocket.on("connect", () => {
      console.log("Connected to server");
      setMyId(newSocket.id);
      newSocket.emit("join", newSocket.id);
      fetchCredits(newSocket.id);
    });

    newSocket.on("incoming-call", ({ callerId }) => {
      setIncomingCall({ callerId });
    });

    newSocket.on("call-accepted", ({ calleeId }) => {
      startCall(calleeId);
    });

    newSocket.on("call-ended", ({ duration, creditsDeducted }) => {
      setCallEndedMessage(
        `Call ended. Duration: ${duration} seconds. Credits deducted: ${creditsDeducted}`
      );
      setCurrentCall(null);
      fetchCredits(newSocket.id);
    });

    setSocket(newSocket);
    setPeer(newPeer);

    return () => {
      newSocket.disconnect();
      newPeer.destroy();
    };
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    console.log({ myId });
  }, [myId]);

  return (
    <div>
      <h1>Voice Call App</h1>
      <p>My ID: {myId}</p>
      <p>My Credits: {credits}</p>

      <div>
        <button onClick={() => handleAddCredits(10)}>Add 10 Credits</button>
      </div>

      {currentCall && (
        <div>
          <h2>Ongoing Call</h2>
          <p>Calling: {currentCall.calleeId}</p>
          <button onClick={endCall}>End Call</button>
        </div>
      )}

      {incomingCall && (
        <div>
          <h2>Incoming Call</h2>
          <p>From: {incomingCall.callerId}</p>
          <button onClick={acceptCall}>Accept</button>
        </div>
      )}

      {callEndedMessage && (
        <div>
          <h2>Call Ended</h2>
          <p>{callEndedMessage}</p>
        </div>
      )}

      <h2>Users</h2>
      <ul>
        {users.map((user) => (
          <li key={user.id}>
            {user.name} (ID: {user.id})
            <button
              onClick={() => handleCall(user.id)}
              disabled={currentCall !== null}
            >
              Call
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
