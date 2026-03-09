import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Flag, RotateCcw, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import StatControl from "@/components/StatControl";

export default function ShiftTimer({ shifts = [], onShiftsChange, selectedStats = [] }) {
  const [isRunning, setIsRunning] = useState(false);
  const [currentSeconds, setCurrentSeconds] = useState(0);
  const [currentStats, setCurrentStats] = useState({});
  const intervalRef = useRef(null);

  useEffect(() => {
    const initialStats = {};
    selectedStats.forEach(stat => {
      initialStats[stat] = 0;
    });
    setCurrentStats(initialStats);
  }, [selectedStats]);

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
        { 
          duration_seconds: currentSeconds, 
          label: `Shift ${shifts.length + 1}`,
          stats: { ...currentStats }
        },
      ];
      onShiftsChange(newShifts);
      setCurrentSeconds(0);
      setIsRunning(false);
      
      const resetStats = {};
      selectedStats.forEach(stat => {
        resetStats[stat] = 0;
      });
      setCurrentStats(resetStats);
    }
  };

  const updateStat = (stat, value) => {
    setCurrentStats(prev => ({ ...prev, [stat]: value }));
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
          TOI: {formatTime(totalIceTime)}
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

      {/* Current Shift Stats */}
      {selectedStats.length > 0 && (
        <div className="mb-4 pb-4 border-b border-slate-700/50">
          <h4 className="text-white font-semibold text-xs mb-3 uppercase tracking-wider">Current Shift Stats</h4>
          <div className="grid grid-cols-2 gap-3">
            {selectedStats.includes("goals") && (
              <StatControl label="Goals" value={currentStats.goals || 0} onChange={(v) => updateStat("goals", v)} color="text-sky-400" />
            )}
            {selectedStats.includes("assists") && (
              <StatControl label="Assists" value={currentStats.assists || 0} onChange={(v) => updateStat("assists", v)} color="text-emerald-400" />
            )}
            {selectedStats.includes("shots") && (
              <StatControl label="Shots" value={currentStats.shots || 0} onChange={(v) => updateStat("shots", v)} />
            )}
            {selectedStats.includes("plus_minus") && (
              <StatControl label="+/-" value={currentStats.plus_minus || 0} onChange={(v) => updateStat("plus_minus", v)} 
                color={currentStats.plus_minus >= 0 ? "text-emerald-400" : "text-red-400"} allowNegative={true} />
            )}
            {selectedStats.includes("hits") && (
              <StatControl label="Hits" value={currentStats.hits || 0} onChange={(v) => updateStat("hits", v)} />
            )}
            {selectedStats.includes("blocked_shots") && (
              <StatControl label="Blocks" value={currentStats.blocked_shots || 0} onChange={(v) => updateStat("blocked_shots", v)} />
            )}
            {selectedStats.includes("takeaways") && (
              <StatControl label="Takeaways" value={currentStats.takeaways || 0} onChange={(v) => updateStat("takeaways", v)} color="text-emerald-400" />
            )}
            {selectedStats.includes("giveaways") && (
              <StatControl label="Giveaways" value={currentStats.giveaways || 0} onChange={(v) => updateStat("giveaways", v)} color="text-red-400" />
            )}
            {selectedStats.includes("penalty_minutes") && (
              <StatControl label="PIM" value={currentStats.penalty_minutes || 0} onChange={(v) => updateStat("penalty_minutes", v)} color="text-red-400" />
            )}
            {selectedStats.includes("faceoff_percentage") && (
              <>
                <StatControl label="FO Won" value={currentStats.faceoff_wins || 0} onChange={(v) => updateStat("faceoff_wins", v)} color="text-emerald-400" />
                <StatControl label="FO Lost" value={currentStats.faceoff_losses || 0} onChange={(v) => updateStat("faceoff_losses", v)} color="text-red-400" />
              </>
            )}
            {selectedStats.includes("power_play_goals") && (
              <StatControl label="PPG" value={currentStats.power_play_goals || 0} onChange={(v) => updateStat("power_play_goals", v)} color="text-sky-400" />
            )}
            {selectedStats.includes("power_play_points") && (
              <StatControl label="PPP" value={currentStats.power_play_points || 0} onChange={(v) => updateStat("power_play_points", v)} color="text-sky-400" />
            )}
            {selectedStats.includes("shorthanded_goals") && (
              <StatControl label="SHG" value={currentStats.shorthanded_goals || 0} onChange={(v) => updateStat("shorthanded_goals", v)} color="text-emerald-400" />
            )}
            {selectedStats.includes("shorthanded_points") && (
              <StatControl label="SHP" value={currentStats.shorthanded_points || 0} onChange={(v) => updateStat("shorthanded_points", v)} color="text-emerald-400" />
            )}
          </div>
        </div>
      )}

      {/* Shift list */}
      {shifts.length > 0 && (
        <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
          {shifts.map((shift, i) => (
            <div key={i} className="bg-slate-900/50 rounded-lg px-3 py-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-400">{shift.label}</span>
                <span className="text-xs text-white font-mono">{formatTime(shift.duration_seconds)}</span>
              </div>
              {shift.stats && Object.keys(shift.stats).length > 0 && (
                <div className="flex gap-2 flex-wrap text-[10px] text-slate-500">
                  {shift.stats.goals > 0 && <span>G: {shift.stats.goals}</span>}
                  {shift.stats.assists > 0 && <span>A: {shift.stats.assists}</span>}
                  {shift.stats.shots > 0 && <span>S: {shift.stats.shots}</span>}
                  {shift.stats.plus_minus !== 0 && <span>+/-: {shift.stats.plus_minus > 0 ? `+${shift.stats.plus_minus}` : shift.stats.plus_minus}</span>}
                  {shift.stats.hits > 0 && <span>H: {shift.stats.hits}</span>}
                  {shift.stats.blocked_shots > 0 && <span>BLK: {shift.stats.blocked_shots}</span>}
                  {shift.stats.takeaways > 0 && <span>TA: {shift.stats.takeaways}</span>}
                  {shift.stats.giveaways > 0 && <span>GA: {shift.stats.giveaways}</span>}
                  {shift.stats.penalty_minutes > 0 && <span>PIM: {shift.stats.penalty_minutes}</span>}
                  {shift.stats.faceoff_wins > 0 && <span>FOW: {shift.stats.faceoff_wins}</span>}
                  {shift.stats.faceoff_losses > 0 && <span>FOL: {shift.stats.faceoff_losses}</span>}
                  {shift.stats.power_play_goals > 0 && <span>PPG: {shift.stats.power_play_goals}</span>}
                  {shift.stats.power_play_points > 0 && <span>PPP: {shift.stats.power_play_points}</span>}
                  {shift.stats.shorthanded_goals > 0 && <span>SHG: {shift.stats.shorthanded_goals}</span>}
                  {shift.stats.shorthanded_points > 0 && <span>SHP: {shift.stats.shorthanded_points}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}