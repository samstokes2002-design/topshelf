import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Target, Plus, Trash2, X, Check, Trophy, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import confetti from "canvas-confetti";

const FREE_STAT_KEYS = ["goals", "assists", "shots", "plus_minus"];

const STAT_OPTIONS = [
  // Session counts (always available)
  { key: "game", label: "Games Played", type: "session_count", pro: false },
  { key: "practice", label: "Practices", type: "session_count", pro: false },
  { key: "training", label: "Training Sessions", type: "session_count", pro: false },
  // Free stats
  { key: "goals", label: "Goals", type: "stat", pro: false },
  { key: "assists", label: "Assists", type: "stat", pro: false },
  { key: "points", label: "Points (G+A)", type: "stat", pro: false },
  { key: "shots", label: "Shots", type: "stat", pro: false },
  { key: "plus_minus", label: "Plus/Minus (+/-)", type: "stat", pro: false },
  // Pro-only stats
  { key: "hits", label: "Hits", type: "stat", pro: true },
  { key: "blocked_shots", label: "Blocked Shots", type: "stat", pro: true },
  { key: "takeaways", label: "Takeaways", type: "stat", pro: true },
  { key: "giveaways", label: "Giveaways", type: "stat", pro: true },
  { key: "penalty_minutes", label: "Penalty Minutes", type: "stat", pro: true },
  { key: "power_play_goals", label: "Power Play Goals", type: "stat", pro: true },
  { key: "power_play_points", label: "Power Play Points", type: "stat", pro: true },
  { key: "shorthanded_goals", label: "Shorthanded Goals", type: "stat", pro: true },
  { key: "shorthanded_points", label: "Shorthanded Points", type: "stat", pro: true },
];

function calculateProgress(target, sessions) {
  const gameSessions = sessions.filter(s => s.type === "game" || s.type === "shift_by_shift");

  if (target.target_type === "session_count") {
    if (target.stat_key === "game") return sessions.filter(s => s.type === "game" || s.type === "shift_by_shift").length;
    return sessions.filter(s => s.type === target.stat_key).length;
  }

  // stat type
  if (target.stat_key === "points") {
    return gameSessions.reduce((sum, s) => sum + (s.goals || 0) + (s.assists || 0), 0);
  }
  return gameSessions.reduce((sum, s) => sum + (s[target.stat_key] || 0), 0);
}

export default function SeasonTargets({ profileId, seasonId, sessions, isPro = false }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [statKey, setStatKey] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [celebrationTarget, setCelebrationTarget] = useState(null);
  const prevCompletedRef = useRef(new Set());

  const { data: targets = [] } = useQuery({
    queryKey: ["season-targets", seasonId],
    queryFn: () => base44.entities.SeasonTarget.filter({ profile_id: profileId, season_id: seasonId }),
    enabled: !!profileId && !!seasonId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.SeasonTarget.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["season-targets", seasonId] });
      setShowForm(false);
      setStatKey("");
      setTargetValue("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SeasonTarget.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["season-targets", seasonId] }),
  });

  // Sync completed/total counts to season + detect celebrations
  useEffect(() => {
    if (!sessions) return;
    if (targets.length === 0) return;

    const nowCompleted = new Set();
    targets.forEach((t) => {
      const current = calculateProgress(t, sessions);
      if (current >= t.target_value) nowCompleted.add(t.id);
    });

    // Save to season entity
    base44.entities.Season.update(seasonId, {
      targets_completed: nowCompleted.size,
      targets_total: targets.length,
    }).then(() => {
      queryClient.invalidateQueries({ queryKey: ["seasons"] });
    });

    // Find targets that just became completed (skip initial load)
    const newlyDone = [...nowCompleted].filter(id => !prevCompletedRef.current.has(id));
    if (newlyDone.length > 0 && prevCompletedRef.current.size > 0) {
      const completedTarget = targets.find(t => t.id === newlyDone[0]);
      if (completedTarget) {
        setCelebrationTarget(completedTarget);
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ["#38bdf8", "#34d399", "#fbbf24", "#f472b6", "#a78bfa"] });
        setTimeout(() => {
          confetti({ particleCount: 60, spread: 100, origin: { y: 0.5, x: 0.2 }, colors: ["#38bdf8", "#34d399", "#fbbf24"] });
          confetti({ particleCount: 60, spread: 100, origin: { y: 0.5, x: 0.8 }, colors: ["#f472b6", "#a78bfa", "#fbbf24"] });
        }, 300);
      }
    }
    prevCompletedRef.current = nowCompleted;
  }, [targets, sessions, seasonId]);

  const existingStatKeys = new Set(targets.map(t => t.stat_key));

  const handleCreate = () => {
    if (!statKey || !targetValue || isNaN(Number(targetValue)) || Number(targetValue) <= 0) return;
    if (existingStatKeys.has(statKey)) return;
    const option = STAT_OPTIONS.find(o => o.key === statKey);
    createMutation.mutate({
      profile_id: profileId,
      season_id: seasonId,
      target_type: option.type,
      stat_key: statKey,
      label: option.label,
      target_value: Number(targetValue),
    });
  };

  return (
    <div className="mb-5">
      {/* Celebration Modal */}
      {celebrationTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-600 rounded-3xl p-8 max-w-xs w-full text-center shadow-2xl animate-[scale-in_0.3s_ease-out]">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/30">
              <Trophy className="w-10 h-10 text-white" />
            </div>

            <h2 className="text-white font-bold text-2xl mb-1">Target Reached!</h2>
            <p className="text-slate-300 text-sm mb-1">You crushed your</p>
            <p className="text-sky-400 font-bold text-lg mb-4">{celebrationTarget.label} goal 🎉</p>
            <p className="text-slate-400 text-xs mb-6">
              {celebrationTarget.target_value} {celebrationTarget.target_value === 1 ? "time" : "times"} — mission accomplished. Keep pushing!
            </p>
            <button
              onClick={() => setCelebrationTarget(null)}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-sky-400 text-white font-bold text-base hover:from-sky-400 hover:to-sky-300 transition-all active:scale-95"
            >
              Let's Go! 🏒
            </button>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-sky-400" />
          <h3 className="text-white font-semibold text-sm">Season Targets</h3>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="w-7 h-7 rounded-full bg-sky-500/20 flex items-center justify-center hover:bg-sky-500/30 transition-colors"
        >
          {showForm ? <X className="w-3.5 h-3.5 text-sky-400" /> : <Plus className="w-3.5 h-3.5 text-sky-400" />}
        </button>
      </div>

      {/* Add Target Form */}
      {showForm && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 mb-3">
          <p className="text-slate-400 text-xs mb-3">Set a personal target for this season</p>
          <div className="space-y-3">
            <div>
              <Label className="text-slate-400 text-xs mb-1.5 block">Stat or Milestone</Label>
              <Select value={statKey} onValueChange={setStatKey}>
                <SelectTrigger className="bg-slate-900/50 border-slate-700/50 text-white rounded-xl">
                  <SelectValue placeholder="Choose a stat..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <div className="px-2 py-1 text-[10px] text-slate-500 uppercase tracking-wider">Session Counts</div>
                  {STAT_OPTIONS.filter(o => o.type === "session_count" && !existingStatKeys.has(o.key)).map(o => (
                    <SelectItem key={o.key} value={o.key} className="text-white focus:bg-slate-700">{o.label}</SelectItem>
                  ))}
                  <div className="px-2 py-1 text-[10px] text-slate-500 uppercase tracking-wider mt-1">Stats</div>
                  {STAT_OPTIONS.filter(o => o.type === "stat" && (isPro || !o.pro) && !existingStatKeys.has(o.key)).map(o => (
                    <SelectItem key={o.key} value={o.key} className="text-white focus:bg-slate-700">{o.label}</SelectItem>
                  ))}
                  {!isPro && (
                    <div className="px-2 py-2 text-[10px] text-amber-500/70 flex items-center gap-1 mt-1">
                      🔒 Defensive & advanced stats require Pro
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-400 text-xs mb-1.5 block">Target Amount</Label>
              <Input
                type="number"
                min="1"
                placeholder="e.g. 20"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                className="bg-slate-900/50 border-slate-700/50 text-white rounded-xl"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowForm(false); setStatKey(""); setTargetValue(""); }}
                className="flex-1 py-2 rounded-xl bg-slate-700/50 text-slate-300 text-sm hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!statKey || !targetValue || createMutation.isPending}
                className="flex-1 py-2 rounded-xl bg-sky-500/20 text-sky-400 text-sm font-semibold hover:bg-sky-500/30 transition-colors disabled:opacity-40"
              >
                {createMutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto" />
                ) : (
                  <span className="flex items-center justify-center gap-1.5"><Check className="w-3.5 h-3.5" /> Add Target</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Target List */}
      {targets.length === 0 && !showForm ? (
        <div className="bg-slate-800/40 border border-dashed border-slate-700/50 rounded-2xl p-6 text-center">
          <Target className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-slate-500 text-sm">No targets set yet</p>
          <p className="text-slate-600 text-xs mt-1">Tap + to add a season goal</p>
        </div>
      ) : (
        <div className="space-y-3">
          {targets.map((target) => {
            const current = calculateProgress(target, sessions);
            const pct = Math.min(100, Math.round((current / target.target_value) * 100));
            const done = current >= target.target_value;
            return (
              <div key={target.id} className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {done && <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />}
                    <span className={`text-sm font-medium ${done ? "text-emerald-400" : "text-white"}`}>{target.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">
                      <span className={`font-bold ${done ? "text-emerald-400" : "text-white"}`}>{current}</span>
                      <span className="text-slate-500"> / {target.target_value}</span>
                    </span>
                    <button
                      onClick={() => deleteMutation.mutate(target.id)}
                      className="text-slate-600 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {/* Progress Bar */}
                <div className="h-1.5 bg-slate-700/60 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${done ? "bg-emerald-400" : "bg-sky-500"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-slate-600">{pct}% complete</span>
                  {!done && <span className="text-[10px] text-slate-600">{target.target_value - current} remaining</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}