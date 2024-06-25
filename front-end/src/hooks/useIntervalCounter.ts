import { useEffect, useMemo, useRef, useState } from "react";

export const useIntervalCountDown = (
  totalSecsToCountDown: number,
  intervalSecs: number
): number => {
  const counterId = useRef<any>(null);
  const initialSecs = useMemo(() => totalSecsToCountDown, [totalSecsToCountDown]);
  const totalIntervals = useMemo(
    () => Math.round(totalSecsToCountDown / intervalSecs),
    [totalSecsToCountDown, initialSecs]
  );
  const [intervalCount, setIntervalCount] = useState(0);

  const startCounter = (currentIntervalCount: number) => {
    clearTimeout(counterId.current);
    counterId.current = setTimeout(
      () => setIntervalCount(currentIntervalCount + 1),
      intervalSecs * 1000
    );
  };

  useEffect(() => {
    if (totalSecsToCountDown <= 0) setIntervalCount(totalIntervals);
    else startCounter(intervalCount);
  }, [intervalCount]);

  return totalIntervals - intervalCount;
};
