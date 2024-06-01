import { useCallback, useEffect, useMemo } from "react";
import { useSocket } from "./hooks/useSocket";
import { useAuth } from "./hooks/useAuth";
import UserSelector from "./components/UserSelector";
import IncomingCall from "./components/IncomingCall";

function App() {
  const auth = useAuth();
  const { socket, connected } = useSocket();
  const socketStatus = useMemo(() => connected, [connected]);

  const handleConnectForm = useCallback(
    (e) => {
      e.preventDefault();
      const form = e.target;
      const formData = new FormData(form);
      const targetUserId = formData.get("targetUserId");
      console.log(`---- ~ handleConnectForm ~ targetUserId:`, targetUserId);
      socket.emit("USER:CALLING", { fromUserId: auth.user.id, targetUserId });
    },
    [auth.user.id, socket]
  );

  useEffect(() => {
    socket.on("USER:JOINED", (data) => {
      console.log("USER JOINED ROOM", data);
    });
    return () => {
      socket.off("USER:JOINED");
    };
  }, [socket]);

  return (
    <div style={{ textAlign: "center" }}>
      <div>Socket status: {socketStatus ? "Connected" : "Not Connected"}</div>
      <UserSelector />
      <div>Current Profile: {auth.user.name}</div>
      <div>Available Credits: {auth.user.credits}</div>
      <div>
        <form onSubmit={handleConnectForm}>
          <h4>Connect to user</h4>
          <label>
            User Id: <input type="text" name="targetUserId" required />
          </label>
          <button type="submit">Connect</button>
        </form>
      </div>
      <IncomingCall />
    </div>
  );
}

export default App;
