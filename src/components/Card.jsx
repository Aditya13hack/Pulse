import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export const Card = React.forwardRef(function Card({ children, className = '', style, introDelay = 0, disableIntro = false }, ref) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      initial={disableIntro || reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={disableIntro || reducedMotion
        ? { duration: 0 }
        : { duration: 0.36, ease: [0.22, 1, 0.36, 1], delay: introDelay }}
      style={style}
      className={`card ${className}`}
    >
      {children}
    </motion.div>
  );
});
