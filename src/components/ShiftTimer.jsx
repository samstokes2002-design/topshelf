import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Flag, RotateCcw, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ShiftTimer({ shifts = [], onShiftsChange }) {
  const [isRunning, setIsRunning] = useState(false);
  const [currentSeconds, setCurrentSeconds] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setCurrentSeconds((s) => s + 1);
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const endShift = () => {
    if (currentSeconds > 0) {
      const newShifts = [
        ...shifts,
        { duration_seconds: currentSeconds, label: `Shift ${shifts.length + 1}` },
      ];
      onShiftsChange(newShifts);
      setCurrentSeconds(0);
      setIsRunning(false);
    }
  };

  const resetAll = () => {
    setCurrentSeconds(0);
    setIsRunning(false);
    onShiftsChange([]);
  };

  const totalIceTime = shifts.reduce((sum, s) => sum + s.duration_seconds, 0);

  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-sky-400" />
          <span className="text-white font-semibold text-sm">Shift Timer</span>
        </div>
        <span className="text-xs text-slate-400">
          Total: {formatTime(totalIceTime)}
        </span>
      </div>

      {/* Current timer */}
      <div className="text-center mb-4">
        <div className="text-4xl font-mono font-bold text-white mb-3">
          {formatTime(currentSeconds)}
        </div>
        <div className="flex justify-center gap-3">
          <Button
            type="button"
            size="sm"
            onClick={() => setIsRunning(!isRunning)}
            className={cn(
              "rounded-xl px-5",
              isRunning
                ? "bg-amber-500 hover:bg-amber-600"
                : "bg-emerald-500 hover:bg-emerald-600"
            )}
          >
            {isRunning ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
            {isRunning ? "Pause" : "Start"}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={endShift}
            disabled={currentSeconds === 0}
            className="bg-sky-500 hover:bg-sky-600 rounded-xl px-5"
          >
            <Flag className="w-4 h-4 mr-1" />
            End Shift
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={resetAll}
            className="text-slate-400 hover:text-white rounded-xl"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Shift list */}
      {shifts.length > 0 && (
        <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
          {shifts.map((shift, i) => (
            <div key={i} className="flex items-center justify-between bg-slate-900/50 rounded-lg px-3 py-2">
              <span className="text-xs text-slate-400">{shift.label}</span>
              <span className="text-xs text-white font-mono">{formatTime(shift.duration_seconds)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}