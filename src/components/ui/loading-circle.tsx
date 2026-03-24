"use client";

import * as React from "react";

interface LoadingCircleProps {
  className?: string;
}

export const LoadingCircle: React.FC<LoadingCircleProps> = ({ className }) => {
  const circles = Array.from({ length: 8 });

  return (
    <div className={["relative aspect-square h-[120px]", className].filter(Boolean).join(" ")}>
      {circles.map((_, i) => (
        <span
          key={i}
          className="
            absolute rounded-full
            border
            bg-gradient-to-tr
            from-gray-300/5 to-gray-200/10
            dark:from-gray-500/10 dark:to-gray-400/10
            backdrop-blur-sm
          "
          style={{
            inset: `${i * 5}%`,
            zIndex: 99 - i,
            borderColor: `rgba(100,100,100,${0.9 - i * 0.1})`,
            animation: `ripple 2s infinite ease-in-out ${i * 0.15}s`,
          }}
        />
      ))}
    </div>
  );
};

