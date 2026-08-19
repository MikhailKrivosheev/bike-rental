'use client';

import { useEffect, useRef, useState } from 'react';

const DURATION_MS = 420;

function easeOut(progress: number) {
  return 1 - (1 - progress) ** 3;
}

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/** Counts from the previous value to `target` so price changes are legible. */
export function useAnimatedNumber(target: number) {
  const [value, setValue] = useState(target);
  const frameRef = useRef<number | undefined>(undefined);
  const fromRef = useRef(target);

  useEffect(() => {
    const from = fromRef.current;
    const start = performance.now();
    // A zero duration makes the first frame land on the target straight away.
    const duration = prefersReducedMotion() ? 0 : DURATION_MS;

    function step(now: number) {
      const progress = Math.min((now - start) / duration, 1);
      const current = from + (target - from) * easeOut(progress);

      setValue(current);
      fromRef.current = current;

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step);
      } else {
        fromRef.current = target;
      }
    }

    frameRef.current = requestAnimationFrame(step);

    return () => {
      if (frameRef.current !== undefined) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [target]);

  return value;
}
