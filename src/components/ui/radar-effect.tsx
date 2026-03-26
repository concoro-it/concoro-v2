"use client";

import React from "react";
import { motion } from "framer-motion";
import { twMerge } from "tailwind-merge";

type CircleProps = React.ComponentProps<typeof motion.div> & {
  idx: number;
};

export function Circle({ className, idx, ...rest }: CircleProps) {
  return (
    <motion.div
      {...rest}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: idx * 0.1, duration: 0.2 }}
      className={twMerge(
        "absolute inset-0 left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-slate-200/80",
        className
      )}
    />
  );
}

export function Radar({ className }: { className?: string }) {
  const circles = new Array(8).fill(1);

  return (
    <div
      className={twMerge(
        "relative flex h-20 w-20 items-center justify-center rounded-full",
        className
      )}
    >
      <style>{`
        @keyframes radar-spin {
          from { transform: rotate(20deg); }
          to   { transform: rotate(380deg); }
        }
        .animate-radar-spin {
          animation: radar-spin 10s linear infinite;
        }
      `}</style>

      <div
        style={{ transformOrigin: "right center" }}
        className="animate-radar-spin absolute right-1/2 top-1/2 z-0 flex h-[5px] w-[360px] items-end justify-center overflow-hidden bg-transparent sm:w-[420px]"
      >
        <div className="relative z-0 h-[1px] w-full bg-gradient-to-r from-transparent via-sky-500/80 to-transparent" />
      </div>

      {circles.map((_, idx) => (
        <Circle
          key={`circle-${idx}`}
          idx={idx}
          style={{
            height: `${(idx + 1) * 4.5}rem`,
            width: `${(idx + 1) * 4.5}rem`,
            border: `1px solid rgba(51, 65, 85, ${0.85 - (idx + 1) * 0.09})`,
          }}
        />
      ))}
    </div>
  );
}
