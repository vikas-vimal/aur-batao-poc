import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { SocketProvider } from "./context/Socket.context.jsx";
import { AuthProvider } from "./context/Auth.context.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <SocketProvider>
        <App />
      </SocketProvider>
    </AuthProvider>
  </React.StrictMode>
);
