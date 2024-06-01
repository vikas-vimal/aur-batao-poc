import { useContext } from "react";
import { AuthContext } from "../context/Auth.context";

export function useAuth() {
  return useContext(AuthContext);
}
