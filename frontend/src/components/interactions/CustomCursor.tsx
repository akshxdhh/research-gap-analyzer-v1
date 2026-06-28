"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export default function CustomCursor() {
  const [isTouchDevice, setIsTouchDevice] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  // Smooth springs for the outer ring (trail)
  const springConfig = { damping: 25, stiffness: 300, mass: 0.5 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  useEffect(() => {
    // Detect touch device
    const checkTouch = () => {
      setIsTouchDevice("ontouchstart" in window || navigator.maxTouchPoints > 0);
    };
    checkTouch();
    
    if (isTouchDevice) return;

    // We will hide the default cursor in global CSS for non-touch devices
    document.documentElement.classList.add("has-custom-cursor");

    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Find if we are hovering over an element that should trigger the hover state
      const isInteractive = target.closest(
        'a, button, [data-cursor="hover"], input, select, textarea'
      );
      if (isInteractive) {
        setIsHovered(true);
      } else {
        setIsHovered(false);
      }
    };

    window.addEventListener("mousemove", moveCursor);
    window.addEventListener("mouseover", handleMouseOver);

    return () => {
      window.removeEventListener("mousemove", moveCursor);
      window.removeEventListener("mouseover", handleMouseOver);
      document.documentElement.classList.remove("has-custom-cursor");
    };
  }, [cursorX, cursorY, isTouchDevice]);

  if (isTouchDevice) return null;

  return (
    <>
      {/* Tiny inner dot (instantly tracks) */}
      <motion.div
        className="fixed top-0 left-0 w-2 h-2 bg-primary rounded-full pointer-events-none z-[9999] mix-blend-screen"
        style={{
          x: cursorX,
          y: cursorY,
          translateX: "-50%",
          translateY: "-50%",
        }}
        animate={{
          scale: isHovered ? 0 : 1,
          opacity: isHovered ? 0 : 1
        }}
        transition={{ duration: 0.2 }}
      />
      
      {/* Outer blurred ring (spring tracks) */}
      <motion.div
        className="fixed top-0 left-0 w-8 h-8 border border-primary/50 bg-primary/10 backdrop-blur-[2px] rounded-full pointer-events-none z-[9998]"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
          translateX: "-50%",
          translateY: "-50%",
        }}
        animate={{
          scale: isHovered ? 2 : 1,
          backgroundColor: isHovered ? "rgba(139, 92, 246, 0.2)" : "rgba(139, 92, 246, 0.1)",
          borderWidth: isHovered ? "0px" : "1px"
        }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      />
    </>
  );
}
