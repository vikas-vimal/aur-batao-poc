/* eslint-disable react/prop-types */
import { useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import useSocket from "../hooks/useSocket";
import Room from "./Room";
import peer from "../lib/peer";

function CallContacts({ usersList = [] }) {
  const auth = useAuth();
  const { socket, callOutgoing, setCallOutgoing } = useSocket();

  const handleMakeCall = useCallback(
    async (user) => {
      const targetUserId = user.id;
      console.log(`---- ~ handleConnectForm ~ targetUserId:`, targetUserId);
      const offer = await peer.getOffer();
      socket.emit("USER:CALLING", { fromUserId: auth.user.id, targetUserId, offer });
      setCallOutgoing(user);
    },
    [auth.user.id, setCallOutgoing, socket]
  );

  return (
    <div>
      <Room />
      <div>
        <h4>Connect to user</h4>
        <div style={{ width: 200, margin: "0 auto" }}>
          {usersList.length
            ? usersList.map((user) => {
                if (user.id === auth.user.id) return null;
                return (
                  <div key={user.id} style={{ textAlign: "left", display: "flex" }}>
                    <div style={{ flexGrow: 1 }}>{user.name}</div>
                    <button
                      onClick={() => handleMakeCall(user)}
                      disabled={user.id === callOutgoing?.id}
                    >
                      {user.id === callOutgoing?.id ? "Calling..." : "Call"}
                    </button>
                  </div>
                );
              })
            : null}
        </div>
      </div>
    </div>
  );
}

export default CallContacts;
