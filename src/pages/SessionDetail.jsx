import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { ArrowLeft, Pencil, Trash2, Trophy, Target, Dumbbell, Clock, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import StarRating from "@/components/ui/StarRating";
import { cn } from "@/lib/utils";

const typeConfig = {
  game: { icon: Trophy, color: "text-sky-400", bg: "bg-sky-500/20", label: "Game" },
  practice: { icon: Target, color: "text-emerald-400", bg: "bg-emerald-500/20", label: "Practice" },
  training: { icon: Dumbbell, color: "text-violet-400", bg: "bg-violet-500/20", label: "Training" },
};

const resultColors = { win: "text-emerald-400", loss: "text-red-400", tie: "text-amber-400" };

export default function SessionDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get("id");
  const queryClient = useQueryClient();

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["session-detail", sessionId],
    queryFn: () => base44.entities.Session.filter({ id: sessionId }),
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
      {session.type === "game" && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <StatBlock label="Goals" value={session.goals || 0} color="text-sky-400" />
          <StatBlock label="Assists" value={session.assists || 0} color="text-emerald-400" />
          <StatBlock label="Shots" value={session.shots || 0} color="text-white" />
          <StatBlock label="+/-" value={`${(session.plus_minus || 0) > 0 ? "+" : ""}${session.plus_minus || 0}`}
            color={(session.plus_minus || 0) >= 0 ? "text-emerald-400" : "text-red-400"} />
        </div>
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
              <div key={i} className="flex items-center justify-between bg-slate-900/50 rounded-lg px-3 py-2">
                <span className="text-xs text-slate-400">{shift.label}</span>
                <span className="text-xs text-white font-mono">{formatTime(shift.duration_seconds)}</span>
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
      <span className={cn("text-2xl font-bold", color)}>{value}</span>
    </div>
  );
}