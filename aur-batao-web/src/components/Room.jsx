/* eslint-disable react/prop-types */
import React from "react";
import IncomingCallScreen from "./IncomingCall";
import OutgoingCallScreen from "./OutgoingCall";
import OngoingCallScreen from "./OngoingCallScreen";

function Room() {
  return (
    <div>
      <IncomingCallScreen />
      <OutgoingCallScreen />
      <OngoingCallScreen />
    </div>
  );
}

export default Room;
