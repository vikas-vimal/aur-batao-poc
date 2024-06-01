import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";

function UserSelector() {
  const auth = useAuth();
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

  return (
    <div>
      {usersList.map((user) => (
        <button
          key={user.id}
          disabled={auth.user.id === user.id}
          onClick={() => {
            auth.setUser(user);
          }}
        >
          {user.name}
        </button>
      ))}
    </div>
  );
}

export default UserSelector;
