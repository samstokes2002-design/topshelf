import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { ArrowLeft, Pencil, Trash2, Trophy, Target, Dumbbell, Timer, Clock, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import StarRating from "@/components/ui/StarRating";
import { cn } from "@/lib/utils";

const typeConfig = {
  game: { icon: Trophy, color: "text-sky-400", bg: "bg-sky-500/20", label: "Game" },
  practice: { icon: Target, color: "text-emerald-400", bg: "bg-emerald-500/20", label: "Practice" },
  training: { icon: Dumbbell, color: "text-violet-400", bg: "bg-violet-500/20", label: "Training" },
  shift_by_shift: { icon: Timer, color: "text-amber-400", bg: "bg-amber-500/20", label: "Shift Tracker" },
};

const resultColors = { win: "text-emerald-400", loss: "text-red-400", tie: "text-amber-400" };

export default function SessionDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get("id");
  const queryClient = useQueryClient();

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["session-detail", sessionId],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      const sessions = await base44.entities.Session.filter({ id: sessionId });
      const session = sessions[0];
      
      if (session) {
        const profiles = await base44.entities.Profile.filter({ 
          id: session.profile_id,
          created_by: currentUser.email 
        });
        if (profiles.length === 0) return [];
      }
      
      return sessions;
    },
    enabled: !!sessionId,
  });

  const session = sessions[0];

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Session.delete(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      window.location.href = createPageUrl("Home");
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="px-4 pt-16 text-center">
        <p className="text-slate-400">Session not found</p>
      </div>
    );
  }

  const config = typeConfig[session.type] || typeConfig.game;
  const Icon = config.icon;
  const formatTime = (secs) => `${Math.floor(secs / 60)}:${(secs % 60).toString().padStart(2, "0")}`;
  const totalIceTime = (session.shifts || []).reduce((s, sh) => s + sh.duration_seconds, 0);

  return (
    <div className="px-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between py-4">
        <button onClick={() => window.history.back()} className="text-slate-400 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex gap-2">
          <Link to={createPageUrl("LogSession") + `?editId=${session.id}&profileId=${session.profile_id}`}>
            <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white rounded-xl">
              <Pencil className="w-4 h-4" />
            </Button>
          </Link>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => { if (confirm("Delete this session?")) deleteMutation.mutate(); }}
            className="text-red-400 hover:text-red-300 rounded-xl"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Session Header */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 mb-4">
        <div className="flex items-center gap-3 mb-3">
          <div className={cn("p-3 rounded-xl", config.bg)}>
            <Icon className={cn("w-6 h-6", config.color)} />
          </div>
          <div>
            <h1 className="text-white font-bold text-xl">{config.label}</h1>
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Calendar className="w-3.5 h-3.5" />
              {session.date ? format(new Date(session.date), "EEEE, MMMM d, yyyy") : ""}
            </div>
          </div>
        </div>

        {session.type === "game" && session.opponent && (
          <div className="flex items-center gap-2 mb-3">
            <span className="text-slate-400 text-sm">vs</span>
            <span className="text-white font-semibold">{session.opponent}</span>
            {session.result && (
              <span className={cn("text-sm font-bold uppercase", resultColors[session.result])}>
                {session.result}
              </span>
            )}
          </div>
        )}

        {session.rating > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-xs">Rating</span>
            <StarRating value={session.rating} readOnly size="sm" />
          </div>
        )}
      </div>

      {/* Stats */}
      {(session.type === "game" || session.type === "shift_by_shift") && (
        <>
          {/* Scoring */}
          {((session.goals || 0) > 0 || (session.assists || 0) > 0 || (session.shots || 0) > 0 || (session.plus_minus || 0) !== 0) && (
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 mb-4">
              <h3 className="text-white font-semibold text-sm mb-3">Scoring</h3>
              <div className="grid grid-cols-2 gap-3">
                {(session.goals || 0) > 0 && <StatBlock label="Goals" value={session.goals} />}
                {(session.assists || 0) > 0 && <StatBlock label="Assists" value={session.assists} />}
                {(session.shots || 0) > 0 && <StatBlock label="Shots" value={session.shots} />}
                {(session.plus_minus || 0) !== 0 && <StatBlock label="+/-" value={`${(session.plus_minus || 0) > 0 ? "+" : ""}${session.plus_minus}`} />}
              </div>
            </div>
          )}

          {/* Defense & Possession */}
          {((session.hits || 0) > 0 || (session.blocked_shots || 0) > 0 || (session.takeaways || 0) > 0 || (session.giveaways || 0) > 0 || (session.penalty_minutes || 0) > 0 || (session.faceoff_wins || 0) > 0 || (session.faceoff_losses || 0) > 0) && (
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 mb-4">
              <h3 className="text-white font-semibold text-sm mb-3">Defense & Possession</h3>
              <div className="grid grid-cols-2 gap-3">
                {(session.hits || 0) > 0 && <StatBlock label="Hits" value={session.hits} />}
                {(session.blocked_shots || 0) > 0 && <StatBlock label="Blocked Shots" value={session.blocked_shots} />}
                {(session.takeaways || 0) > 0 && <StatBlock label="Takeaways" value={session.takeaways} />}
                {(session.giveaways || 0) > 0 && <StatBlock label="Giveaways" value={session.giveaways} />}
                {(session.penalty_minutes || 0) > 0 && <StatBlock label="Penalty Min" value={session.penalty_minutes} />}
                {((session.faceoff_wins || 0) > 0 || (session.faceoff_losses || 0) > 0) && (
                  <StatBlock
                    label="FO%"
                    value={`${(((session.faceoff_wins || 0) / ((session.faceoff_wins || 0) + (session.faceoff_losses || 0))) * 100).toFixed(1)}%`}
                  />
                )}
              </div>
            </div>
          )}

          {/* Advanced Stats */}
          {((session.power_play_goals || 0) > 0 || (session.power_play_points || 0) > 0 || (session.shorthanded_goals || 0) > 0 || (session.shorthanded_points || 0) > 0 || (session.time_on_ice || 0) > 0) && (
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 mb-4">
              <h3 className="text-white font-semibold text-sm mb-3">Advanced Stats</h3>
              <div className="grid grid-cols-2 gap-3">
                {(session.power_play_goals || 0) > 0 && <StatBlock label="PPG" value={session.power_play_goals} />}
                {(session.power_play_points || 0) > 0 && <StatBlock label="PPP" value={session.power_play_points} />}
                {(session.shorthanded_goals || 0) > 0 && <StatBlock label="SHG" value={session.shorthanded_goals} />}
                {(session.shorthanded_points || 0) > 0 && <StatBlock label="SHP" value={session.shorthanded_points} />}
                {(session.time_on_ice || 0) > 0 && <StatBlock label="Time on Ice" value={`${session.time_on_ice}m`} />}
              </div>
            </div>
          )}
        </>
      )}

      {/* Duration */}
      {session.duration > 0 && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 mb-4 flex items-center gap-3">
          <Clock className="w-4 h-4 text-slate-400" />
          <span className="text-white font-medium">{session.duration} minutes</span>
        </div>
      )}

      {/* Shifts */}
      {session.shifts && session.shifts.length > 0 && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold text-sm">Shifts</h3>
            <span className="text-xs text-slate-400">Total: {formatTime(totalIceTime)}</span>
          </div>
          <div className="space-y-1.5">
            {session.shifts.map((shift, i) => (
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
                    {shift.stats.plus_minus !== 0 && <span>+/-: {shift.stats.plus_minus}</span>}
                    {shift.stats.hits > 0 && <span>H: {shift.stats.hits}</span>}
                    {shift.stats.blocked_shots > 0 && <span>BLK: {shift.stats.blocked_shots}</span>}
                    {shift.stats.takeaways > 0 && <span>TK: {shift.stats.takeaways}</span>}
                    {shift.stats.giveaways > 0 && <span>GV: {shift.stats.giveaways}</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {session.notes && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
          <h3 className="text-white font-semibold text-sm mb-2">Notes</h3>
          <p className="text-slate-300 text-sm leading-relaxed">{session.notes}</p>
        </div>
      )}
    </div>
  );
}

function StatBlock({ label, value, color }) {
  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 text-center">
      <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">{label}</span>
      <span className="text-2xl font-bold text-white">{value}</span>
    </div>
  );
}