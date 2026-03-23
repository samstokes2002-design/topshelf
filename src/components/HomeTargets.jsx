import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Target, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

function calculateProgress(target, sessions) {
  const gameSessions = sessions.filter(s => s.type === "game" || s.type === "shift_by_shift");
  if (target.target_type === "session_count") {
    if (target.stat_key === "game") return sessions.filter(s => s.type === "game" || s.type === "shift_by_shift").length;
    return sessions.filter(s => s.type === target.stat_key).length;
  }
  if (target.stat_key === "points") {
    return gameSessions.reduce((sum, s) => sum + (s.goals || 0) + (s.assists || 0), 0);
  }
  return gameSessions.reduce((sum, s) => sum + (s[target.stat_key] || 0), 0);
}

export default function HomeTargets({ profileId, seasonId, sessions }) {
  const { data: targets = [] } = useQuery({
    queryKey: ["season-targets", seasonId],
    queryFn: () => base44.entities.SeasonTarget.filter({ profile_id: profileId, season_id: seasonId }),
    enabled: !!profileId && !!seasonId,
  });

  if (targets.length === 0) return null;

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-sky-400" />
          <h2 className="text-white font-semibold text-sm">Season Targets</h2>
        </div>
        <Link to={createPageUrl("Profile")} className="text-xs text-sky-400 hover:text-sky-300">
          View All
        </Link>
      </div>
      <div className="space-y-2.5">
        {targets.map(target => {
          const current = calculateProgress(target, sessions);
          const pct = Math.min(100, Math.round((current / target.target_value) * 100));
          const done = current >= target.target_value;
          return (
            <div key={target.id} className="bg-slate-800/60 border border-slate-700/50 rounded-2xl px-4 py-3">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  {done && <Check className="w-3 h-3 text-emerald-400 flex-shrink-0" />}
                  <span className={`text-sm font-medium ${done ? "text-emerald-400" : "text-white"}`}>{target.label}</span>
                </div>
                <span className="text-xs text-slate-400">
                  <span className={`font-bold ${done ? "text-emerald-400" : "text-white"}`}>{current}</span>
                  <span className="text-slate-500"> / {target.target_value}</span>
                </span>
              </div>
              <div className="h-1.5 bg-slate-700/60 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${done ? "bg-emerald-400" : "bg-sky-500"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-600 mt-1">{pct}% complete</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}