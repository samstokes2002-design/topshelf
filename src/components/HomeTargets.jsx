import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Target, Check, ChevronRight } from "lucide-react";
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

  // Find the target with the lowest completion % that isn't already done
  const withProgress = targets.map(t => {
    const current = calculateProgress(t, sessions);
    const pct = Math.min(100, (current / t.target_value) * 100);
    return { ...t, current, pct };
  });

  // Prefer incomplete targets sorted by lowest %; fall back to the completed one if all done
  const incomplete = withProgress.filter(t => t.pct < 100).sort((a, b) => a.pct - b.pct);
  const focus = incomplete.length > 0 ? incomplete[0] : withProgress.sort((a, b) => a.pct - b.pct)[0];
  if (!focus) return null;

  const done = focus.pct >= 100;
  const displayPct = Math.round(focus.pct);
  const remaining = Math.max(0, focus.target_value - focus.current);

  return (
    <Link to={createPageUrl("Profile")} className="block mb-5">
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl px-4 py-4 hover:bg-slate-800/80 transition-colors">
        {/* Header row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-sky-400" />
            <span className="text-white font-semibold text-sm">Focus Target</span>
          </div>
          <div className="flex items-center gap-1 text-slate-500">
            <span className="text-xs">{targets.length > 1 ? `1 of ${targets.length}` : ""}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Target info */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            {done && <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />}
            <span className={`text-base font-bold ${done ? "text-emerald-400" : "text-white"}`}>
              {focus.label}
            </span>
          </div>
          <span className="text-sm font-semibold">
            <span className={done ? "text-emerald-400" : "text-white"}>{focus.current}</span>
            <span className="text-slate-500"> / {focus.target_value}</span>
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-slate-700/60 rounded-full overflow-hidden mb-1.5">
          <div
            className={`h-full rounded-full transition-all duration-500 ${done ? "bg-emerald-400" : "bg-sky-500"}`}
            style={{ width: `${displayPct}%` }}
          />
        </div>

        <div className="flex justify-between items-center">
          <span className="text-[11px] text-slate-500">{displayPct}% complete</span>
          {!done && (
            <span className="text-[11px] text-slate-500">{remaining} to go</span>
          )}
          {done && (
            <span className="text-[11px] text-emerald-500 font-semibold">Target reached! 🎉</span>
          )}
        </div>
      </div>
    </Link>
  );
}