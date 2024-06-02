import useSocket from "../hooks/useSocket";

function IncomingCallScreen() {
  const { callIncoming } = useSocket();
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

export default IncomingCallScreen;
