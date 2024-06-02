/* eslint-disable react/prop-types */
import React from "react";
import IncomingCall from "./IncomingCall";
import OutgoingCall from "./OutgoingCall";

function Room() {
  return (
    <div>
      <IncomingCall />
      <OutgoingCall />
    </div>
  );
}

export default Room;
