'use client';

import { useEffect, useState, useRef } from 'react';

/**
 * Animates a number from 0 to `target` over `duration` ms.
 * Uses requestAnimationFrame with an ease-out curve.
 */
export function useCountUp(target: number, duration = 1200): number {
  const [value, setValue] = useState(0);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const targetRef = useRef(target);

  useEffect(() => {
    targetRef.current = target;
    startRef.current = null;

    if (!Number.isFinite(target)) {
      setValue(0);
      return;
    }

    if (target === 0) {
      setValue(0);
      return;
    }

    function step(ts: number) {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(targetRef.current * eased));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    }

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return value;
}