import React, { useCallback, useRef, useState } from "react";
import ReactPlayer from "react-player";

function AudioTest() {
  const [streamOn, setStreamOn] = useState(false);
  const [stream, setStream] = useState(null);
  const localAudioRef = useRef(null);

  const startAudioStream = useCallback(async () => {
    try {
      setStreamOn(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      setStream(stream);
    } catch (error) {
      console.log(error);
      alert("Unable to get device audio!");
    }
  }, []);

  const stopAudioStream = useCallback(() => {
    setStreamOn(false);
    stream.getTracks().forEach((track) => track.stop());
    setStream(null);
  }, [stream]);

  return (
    <div>
      <h1>AudioTest</h1>
      {!streamOn ? (
        <button onClick={startAudioStream}>Start Audio</button>
      ) : (
        <>
          <button onClick={stopAudioStream}>Stop Audio</button>
          <ReactPlayer
            ref={localAudioRef}
            url={stream}
            muted
            controls
            playing={true}
          />
        </>
      )}
    </div>
  );
}

export default AudioTest;
