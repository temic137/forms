"use client";

import { useEffect, useState } from "react";

interface RotatingTextProps {
  words: string[];
  duration?: number;
  className?: string;
}

export default function RotatingText({ words, duration = 2500, className = "" }: RotatingTextProps) {
  const [index, setIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % words.length);
        setIsVisible(true);
      }, 400); // Duration of fade out transition

    }, duration);

    return () => clearInterval(interval);
  }, [words.length, duration]);

  return (
    <span 
      className={`inline-block transition-all duration-400 transform whitespace-nowrap ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      } ${className}`}
    >
      {words[index]}
    </span>
  );
}

