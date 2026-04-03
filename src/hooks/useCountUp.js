import { useState, useEffect } from 'react';

export function useCountUp(endValue, duration = 1200) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    let animationFrameId;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // ease-out quintic
      const easeOut = 1 - Math.pow(1 - progress, 5);
      const currentVal = easeOut * endValue;
      
      // Formatting depends on whether we want floats or ints, but 
      // usually currency values have 2 decimals or are ints. 
      // We will let the display component format it, so we return the raw number.
      setCount(currentVal);

      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      } else {
        setCount(endValue);
      }
    };

    animationFrameId = window.requestAnimationFrame(step);

    return () => window.cancelAnimationFrame(animationFrameId);
  }, [endValue, duration]);

  return count;
}
