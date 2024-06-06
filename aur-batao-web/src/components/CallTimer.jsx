/* eslint-disable no-unused-vars */
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

function CallTimer(props, ref) {
  const startTimeRef = useRef(0);
  const elapsedTimeRef = useRef(0);
  const intervalRef = useRef(null);
  const [displayTime, setDisplayTime] = useState(0);

  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, []);

  const formatTime = (milliseconds = 0) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600)
      .toString()
      .padStart(2, "0");
    const minutes = Math.floor((totalSeconds % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");
    return hours !== "00" ? `${hours}:${minutes}:${seconds}` : `${minutes}:${seconds}`;
  };

  useImperativeHandle(ref, () => {
    return {
      stopTimer,
    };
  });

  useEffect(() => {
    startTimeRef.current = Date.now() - elapsedTimeRef.current;
    intervalRef.current = setInterval(() => {
      elapsedTimeRef.current = Date.now() - startTimeRef.current;
      setDisplayTime(elapsedTimeRef.current);
    }, 1000);
  }, []);

  return (
    <div>
      <h5 style={{ marginTop: 6 }}>{formatTime(displayTime)}</h5>
    </div>
  );
}

const CallTimerComponent = forwardRef(CallTimer);
CallTimerComponent.displayName = "CallTimer";

export default CallTimerComponent;
