import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface Props {
  value: number | null;
  isRolling: boolean;
  canRoll: boolean;
  onRoll: () => void;
}

const DOTS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[30, 30], [70, 70]],
  3: [[30, 30], [50, 50], [70, 70]],
  4: [[30, 30], [70, 30], [30, 70], [70, 70]],
  5: [[30, 30], [70, 30], [50, 50], [30, 70], [70, 70]],
  6: [[30, 25], [70, 25], [30, 50], [70, 50], [30, 75], [70, 75]],
};

function randomFace(): number {
  return Math.floor(Math.random() * 6) + 1;
}

export default function Dice({ value, isRolling, canRoll, onRoll }: Props) {
  const [displayFace, setDisplayFace] = useState<number>(value ?? randomFace());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevRolling = useRef(false);

  useEffect(() => {
    if (isRolling && !prevRolling.current) {
      intervalRef.current = setInterval(() => {
        setDisplayFace(randomFace());
      }, 80);
    }

    if (!isRolling && prevRolling.current) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (value !== null) {
        setDisplayFace(value);
      }
    }

    prevRolling.current = isRolling;

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRolling, value]);

  useEffect(() => {
    if (!isRolling && value !== null) {
      setDisplayFace(value);
    }
  }, [value, isRolling]);

  const dots = DOTS[displayFace] ?? [];

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={canRoll ? onRoll : undefined}
        disabled={!canRoll}
        className={cn(
          "relative w-20 h-20 rounded-2xl select-none outline-none",
          "transition-transform duration-100",
          canRoll && !isRolling && "hover:scale-105 active:translate-y-1 cursor-pointer",
          !canRoll && "cursor-not-allowed opacity-50",
          isRolling && "cursor-wait"
        )}
        style={{
          background: "white",
          border: "2px solid #e2e8f0",
          boxShadow: canRoll
            ? "0 6px 0 #94a3b8, 0 8px 16px rgba(0,0,0,0.2)"
            : "0 3px 0 #cbd5e1, 0 5px 10px rgba(0,0,0,0.1)",
          animation: isRolling ? "diceShake 0.15s ease-in-out infinite" : "none",
        }}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full p-2"
          style={{ transition: "none" }}
        >
          {dots.map(([cx, cy], i) => (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={9}
              fill="#1e293b"
              style={{ filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.25))" }}
            />
          ))}
        </svg>
      </button>

      <span className={cn(
        "text-xs font-medium transition-colors duration-200",
        canRoll && !isRolling
          ? "text-violet-600 dark:text-violet-400"
          : "text-slate-400 dark:text-slate-500"
      )}>
        {isRolling ? "Rolling..." : canRoll ? "Click to roll" : "Wait..."}
      </span>

      <style>{`
        @keyframes diceShake {
          0%   { transform: rotate(-10deg) translateY(-2px); }
          25%  { transform: rotate( 10deg) translateY( 2px); }
          50%  { transform: rotate(-8deg)  translateY(-1px); }
          75%  { transform: rotate(  8deg) translateY( 1px); }
          100% { transform: rotate(-10deg) translateY(-2px); }
        }
      `}</style>
    </div>
  );
}
