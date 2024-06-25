import { useEffect, useRef, useState } from "react";

export const useCountDownTimer = (cdInSecs: number): boolean => {
  const counterId = useRef<any>(null);
  const [hasTimedOut, setHasTimedOut] = useState(cdInSecs <= 0);

  const startCounter = (secsToCountDown: number) => {
    clearTimeout(counterId.current);
    counterId.current = setTimeout(() => {
      setHasTimedOut(true);
    }, secsToCountDown * 1000);
  };

  useEffect(() => {
    if (cdInSecs > 0) startCounter(cdInSecs);
    else setHasTimedOut(true);
  }, [cdInSecs]);

  return hasTimedOut;
};
