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
  time_on_ice: "TOI (min)",
  rating: "Avg Rating",
};

export default function SeasonStats({ sessions, selectedStats = [] }) {
  const games = sessions.filter((s) => s.type === "game");

  const calculateStat = (stat) => {
    if (stat === "rating") {
      const rated = games.filter((g) => g.rating);
      if (rated.length === 0) return 0;
      const total = rated.reduce((sum, g) => sum + g.rating, 0);
      return (total / rated.length).toFixed(1);
    }
    return games.reduce((sum, g) => sum + (g[stat] || 0), 0);
  };

  const validStats = selectedStats.filter((stat) => statLabels[stat]);

  if (validStats.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 pt-3 border-t border-slate-700/50">
      <div className="grid grid-cols-3 gap-2">
        {validStats.map((stat) => (
          <div key={stat} className="text-center">
            <span className="text-sm font-semibold text-white">{calculateStat(stat)}</span>
            <span className="text-[10px] text-slate-400 block">{statLabels[stat]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}