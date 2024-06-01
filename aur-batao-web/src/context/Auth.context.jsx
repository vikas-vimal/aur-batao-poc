import { createContext, useState } from "react";

const initialValues = {
  user: {
    id: "1",
    name: "Viii User",
    credits: 10,
  },
  setUser: ({ id, name, credits }) => {},
};

export const AuthContext = createContext(initialValues);

// eslint-disable-next-line react/prop-types
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState({
    id: "1",
    name: "Viii User",
    credits: 10,
  });

  return (
    <AuthContext.Provider value={{ user, setUser }}>{children}</AuthContext.Provider>
  );
};
