import React from "react";
import { format, parseISO } from "date-fns";
import { Trophy, Target, Clock, TrendingUp, Dumbbell, Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import StarRating from "@/components/ui/StarRating";

const typeConfig = {
  game: { icon: Trophy, color: "bg-sky-500/20 text-sky-400", label: "Game" },
  practice: { icon: Target, color: "bg-emerald-500/20 text-emerald-400", label: "Practice" },
  training: { icon: Dumbbell, color: "bg-violet-500/20 text-violet-400", label: "Training" },
  shift_by_shift: { icon: Timer, color: "bg-amber-500/20 text-amber-400", label: "Shift by Shift" },
};

const resultBadge = {
  win: "bg-emerald-500/20 text-emerald-400",
  loss: "bg-red-500/20 text-red-400",
  tie: "bg-amber-500/20 text-amber-400",
};

export default function SessionCard({ session, profileName, showProfile = false, onClick }) {
  const config = typeConfig[session.type] || typeConfig.game;
  const Icon = config.icon;
  const points = (session.goals || 0) + (session.assists || 0);

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-4 hover:bg-slate-800/80 transition-all duration-200 active:scale-[0.98]"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-xl", config.color)}>
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold text-sm">{config.label}</span>
              {session.type === "game" && session.result && (
                <span className={cn("text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md", resultBadge[session.result])}>
                  {session.result}
                </span>
              )}
            </div>
            <p className="text-slate-400 text-xs">
              {session.date ? format(parseISO(session.date + "T12:00:00"), "MMM d, yyyy") : ""}
              {session.opponent ? ` vs ${session.opponent}` : ""}
            </p>
          </div>
        </div>
        {session.rating > 0 && <StarRating value={session.rating} size="sm" readOnly />}
      </div>

      {showProfile && profileName && (
        <p className="text-xs text-slate-500 mb-2">{profileName}</p>
      )}

      {(session.type === "game" || session.type === "shift_by_shift") && (
        <div className="space-y-2">
          <div className="flex gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">G</span>
              <span className="text-white font-bold">{session.goals || 0}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">A</span>
              <span className="text-white font-bold">{session.assists || 0}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">P</span>
              <span className="text-sky-400 font-bold">{points}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">SOG</span>
              <span className="text-white font-bold">{session.shots || 0}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">+/-</span>
              <span className={cn("font-bold", (session.plus_minus || 0) >= 0 ? "text-emerald-400" : "text-red-400")}>
                {(session.plus_minus || 0) > 0 ? "+" : ""}{session.plus_minus || 0}
              </span>
            </div>
          </div>
          {((session.hits || 0) > 0 || (session.blocked_shots || 0) > 0 || (session.takeaways || 0) > 0 || (session.giveaways || 0) > 0) && (
            <div className="flex gap-4 text-xs border-t border-slate-700/50 pt-2">
              {(session.hits || 0) > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">H</span>
                  <span className="text-white font-bold">{session.hits}</span>
                </div>
              )}
              {(session.blocked_shots || 0) > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">BLK</span>
                  <span className="text-white font-bold">{session.blocked_shots}</span>
                </div>
              )}
              {(session.takeaways || 0) > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">TK</span>
                  <span className="text-emerald-400 font-bold">{session.takeaways}</span>
                </div>
              )}
              {(session.giveaways || 0) > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">GV</span>
                  <span className="text-red-400 font-bold">{session.giveaways}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {session.duration > 0 && (
        <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
          <Clock className="w-3 h-3" />
          <span>{session.duration} min</span>
        </div>
      )}

      {session.notes && (
        <p className="text-xs text-slate-400 mt-2 line-clamp-2 italic">"{session.notes}"</p>
      )}
    </button>
  );
}