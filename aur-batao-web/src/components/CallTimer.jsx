/* eslint-disable no-unused-vars */
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

function CallTimer(props, ref) {
  const timerRef = useRef(0);
  const intervalRef = useRef(null);

  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, []);

  useImperativeHandle(ref, () => {
    return {
      stopTimer,
    };
  });

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      timerRef.current += 1;
    }, 1000);
  }, []);

  return (
    <div>
      <h5 style={{ marginTop: 6 }}>00:{timerRef.current}</h5>
    </div>
  );
}

const CallTimerComponent = forwardRef(CallTimer);
CallTimerComponent.displayName = "CallTimer";

export default CallTimerComponent;
