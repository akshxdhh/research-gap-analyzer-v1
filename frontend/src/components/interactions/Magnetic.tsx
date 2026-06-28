"use client";

import { useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

interface MagneticProps {
  children: React.ReactElement;
  intensity?: number;
}

export default function Magnetic({ children, intensity = 0.3 }: MagneticProps) {
  const ref = useRef<HTMLDivElement>(null);
  
  // Track magnetic offset
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Apply spring for smooth return and movement
  const springConfig = { damping: 15, stiffness: 150, mass: 0.1 };
  const smoothX = useSpring(x, springConfig);
  const smoothY = useSpring(y, springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY } = e;
    if (!ref.current) return;
    
    const { height, width, left, top } = ref.current.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);

    x.set(middleX * intensity);
    y.set(middleY * intensity);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: smoothX, y: smoothY, display: 'inline-block' }}
      className="z-10 relative"
      data-cursor="hover"
    >
      {children}
    </motion.div>
  );
}
