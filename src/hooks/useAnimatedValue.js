import { useRef, useState, useEffect } from 'react';

/**
 * useAnimatedValue — smoothly interpolates from old value to new value
 * using requestAnimationFrame. Returns the current animated number.
 * @param {number} target - target value
 * @param {number} duration - animation duration in ms (default 800)
 */
export function useAnimatedValue(target, duration = 800) {
  const [current, setCurrent] = useState(target);
  const startRef = useRef(null);
  const startValRef = useRef(target);
  const frameRef = useRef(null);

  useEffect(() => {
    const startVal = current;
    const endVal = target;
    if (startVal === endVal) return;

    startValRef.current = startVal;
    const startTime = performance.now();

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = startVal + (endVal - startVal) * eased;
      setCurrent(value);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setCurrent(endVal);
      }
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  return current;
}
