import { useCallback, useEffect, useMemo, useState } from "react";
import CallContacts from "./components/CallContacts";
import UserSelector from "./components/UserSelector";
import { useAuth } from "./hooks/useAuth";
import { useSocket } from "./hooks/useSocket";

function App() {
  const auth = useAuth();
  const { socket, connected } = useSocket();
  const socketStatus = useMemo(() => connected, [connected]);

  const [usersList, setUsersList] = useState([]);

  const fetchUsersList = useCallback(async () => {
    const response = await fetch("http://localhost:6080/users-list");
    const data = await response.json();
    console.log("users list", data);
    setUsersList(data);
  }, []);

  useEffect(() => {
    fetchUsersList();
  }, [fetchUsersList]);

  const handleUserJoined = useCallback((data) => {
    console.log("USER JOINED ROOM", data);
  }, []);

  useEffect(() => {
    socket.on("USER:JOINED", handleUserJoined);
    return () => {
      socket.off("USER:JOINED", handleUserJoined);
    };
  }, [handleUserJoined, socket]);

  return (
    <div style={{ textAlign: "center" }}>
      <div>Socket status: {socketStatus ? "Connected" : "Not Connected"}</div>
      <UserSelector usersList={usersList} />
      <div>Current Profile: {auth.user.name}</div>
      <div>Available Credits: {auth.user.credits}</div>
      <CallContacts usersList={usersList} />
    </div>
  );
}

export default App;
