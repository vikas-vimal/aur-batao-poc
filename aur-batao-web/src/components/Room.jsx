/* eslint-disable react/prop-types */
import React, { useCallback, useEffect, useRef } from "react";

function Room() {
  const myAudio = useRef(null);

  const createPeer = useCallback((targetUserId, myCallerId, stream) => {}, []);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({
        audio: true,
      })
      .then((stream) => {
        myAudio.current.srcObject = stream;
      });
  }, []);

  return (
    <div>
      <audio ref={myAudio} autoPlay hidden muted />
    </div>
  );
}

export default Room;
