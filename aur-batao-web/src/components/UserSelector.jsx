import { useAuth } from "../hooks/useAuth";

// eslint-disable-next-line react/prop-types
function UserSelector({ usersList = [] }) {
  const auth = useAuth();

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
