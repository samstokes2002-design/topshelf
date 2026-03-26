import React from "react";

const statLabels = {
  goals: "Goals",
  assists: "Assists",
  shots: "Shots",
  plus_minus: "+/-",
  penalty_minutes: "PIM",
  hits: "Hits",
  blocked_shots: "Blocks",
  takeaways: "Takeaways",
  giveaways: "Giveaways",
  faceoff_wins: "FO Wins",
  faceoff_losses: "FO Losses",
  power_play_goals: "PPG",
  power_play_points: "PPP",
  shorthanded_goals: "SHG",
  shorthanded_points: "SHP",
  time_on_ice: "TOI",
  rating: "Avg Rating",
};

export default function SeasonStats({ sessions, selectedStats = [] }) {
  const games = sessions.filter((s) => s.type === "game" || s.type === "shift_by_shift");

  const totalHours = +(sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / 60).toFixed(1);

  return (
    <div className="mt-3 pt-3 border-t border-border">
      <div className="grid grid-cols-3 gap-2">
        {validStats.map((stat) => (
          <div key={stat} className="text-center">
            <span className="text-sm font-semibold text-foreground">{calculateStat(stat)}</span>
            <span className="text-[10px] text-muted-foreground block">{statLabels[stat]}</span>
          </div>
        ))}
        <div className="text-center">
          <span className="text-sm font-semibold text-foreground">{totalHours}</span>
          <span className="text-[10px] text-muted-foreground block">Hours</span>
        </div>
      </div>
    </div>
  );
}