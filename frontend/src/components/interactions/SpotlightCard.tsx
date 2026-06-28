"use client";

import { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useMotionTemplate } from "framer-motion";

export default function SpotlightCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  
  // Track mouse relative to the card
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for the light position
  const smoothX = useSpring(mouseX, { stiffness: 300, damping: 40 });
  const smoothY = useSpring(mouseY, { stiffness: 300, damping: 40 });

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!ref.current) return;
    const { left, top } = ref.current.getBoundingClientRect();
    mouseX.set(e.clientX - left);
    mouseY.set(e.clientY - top);
  }

  // Create the dynamic radial gradient mask
  const background = useMotionTemplate`radial-gradient(
    400px circle at ${smoothX}px ${smoothY}px,
    rgba(139, 92, 246, 0.15),
    transparent 80%
  )`;

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -5, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`relative group overflow-hidden ${className}`}
      data-cursor="hover"
    >
      {/* Dynamic spotlight layer */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 z-0"
        style={{ background }}
      />
      
      {/* Content wrapper */}
      <div className="relative z-10 h-full w-full pointer-events-auto">
        {children}
      </div>
    </motion.div>
  );
}
