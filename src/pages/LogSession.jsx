import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Trophy, Target, Dumbbell, Timer, Check, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import StarRating from "@/components/ui/StarRating";
import ShiftTimer from "@/components/ShiftTimer";
import StatControl from "@/components/StatControl";

const sessionTypes = [
  { value: "game", label: "Game", icon: Trophy, color: "bg-sky-500/20 text-sky-400 border-sky-500/30" },
  { value: "practice", label: "Practice", icon: Target, color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  { value: "training", label: "Training", icon: Dumbbell, color: "bg-violet-500/20 text-violet-400 border-violet-500/30" },
  { value: "shift_by_shift", label: "Shift by Shift", icon: Timer, color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
];

export default function LogSession() {
  const urlParams = new URLSearchParams(window.location.search);
  const profileId = urlParams.get("profileId");
  const editId = urlParams.get("editId");
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [saved, setSaved] = useState(false);
  const [savedDraft, setSavedDraft] = useState(false);
  const [currentPeriod, setCurrentPeriod] = useState(1);
  const DRAFT_KEY = "shift_session_draft";

  const [form, setForm] = useState(() => {
    // Try to restore draft on mount
    if (!editId) {
      try {
        const draft = localStorage.getItem(DRAFT_KEY);
        if (draft) return JSON.parse(draft);
      } catch (e) {}
    }
    return {
    profile_id: profileId || "",
    season_id: "",
    date: "",
    type: "game",
    duration: "",
    goals: 0,
    assists: 0,
    shots: 0,
    plus_minus: 0,
    penalty_minutes: 0,
    hits: 0,
    blocked_shots: 0,
    takeaways: 0,
    giveaways: 0,
    faceoff_wins: 0,
    faceoff_losses: 0,
    power_play_goals: 0,
    power_play_points: 0,
    shorthanded_goals: 0,
    shorthanded_points: 0,
    time_on_ice: 0,
    rating: 0,
    notes: "",
    opponent: "",
    result: "",
      shifts: [],
    };
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return base44.entities.Profile.filter({ created_by: currentUser.email }, "-created_date");
    },
  });

  const { data: seasons = [] } = useQuery({
    queryKey: ["seasons", form.profile_id],
    queryFn: async () => {
      if (!form.profile_id) return [];
      return base44.entities.Season.filter({ profile_id: form.profile_id }, "-created_date");
    },
    enabled: !!form.profile_id,
  });

  const { data: activeSeason } = useQuery({
    queryKey: ["activeSeason", form.profile_id],
    queryFn: async () => {
      if (!form.profile_id) return null;
      const activeSeasons = await base44.entities.Season.filter({ 
        profile_id: form.profile_id,
        is_active: true 
      });
      return activeSeasons[0] || null;
    },
    enabled: !!form.profile_id,
  });

  // Auto-select active season
  useEffect(() => {
    if (activeSeason) {
      setForm((f) => ({ ...f, season_id: activeSeason.id }));
    }
  }, [activeSeason]);

  // Auto-update PPP if PPG is logged without PPP
  useEffect(() => {
    setForm((f) => {
      if (f.power_play_goals > 0 && f.power_play_points === 0) {
        return { ...f, power_play_points: f.power_play_goals };
      }
      return f;
    });
  }, [form.power_play_goals]);

  // Auto-update SHP if SHG is logged without SHP
  useEffect(() => {
    setForm((f) => {
      if (f.shorthanded_goals > 0 && f.shorthanded_points === 0) {
        return { ...f, shorthanded_points: f.shorthanded_goals };
      }
      return f;
    });
  }, [form.shorthanded_goals]);

  const selectedSeason = seasons.find(s => s.id === form.season_id) || activeSeason;
  const defaultStats = ["goals", "assists", "shots", "plus_minus", "hits", "blocked_shots", "takeaways", "giveaways", "penalty_minutes"];
  const rawSelectedStats = selectedSeason?.selected_stats || [];
  const selectedStats = (form.type === "shift_by_shift" || form.type === "game") && rawSelectedStats.length === 0
    ? defaultStats
    : rawSelectedStats;

  // Load session for editing
  const { data: editSession } = useQuery({
    queryKey: ["session-edit", editId],
    queryFn: async () => {
      const sessions = await base44.entities.Session.filter({ id: editId });
      return sessions[0];
    },
    enabled: !!editId,
  });

  useEffect(() => {
    if (editSession) {
      setForm({
        profile_id: editSession.profile_id || "",
        date: editSession.date || format(new Date(), "yyyy-MM-dd"),
        type: editSession.type || "game",
        duration: editSession.duration?.toString() || "",
        goals: editSession.goals || 0,
        assists: editSession.assists || 0,
        shots: editSession.shots || 0,
        plus_minus: editSession.plus_minus || 0,
        penalty_minutes: editSession.penalty_minutes || 0,
        hits: editSession.hits || 0,
        blocked_shots: editSession.blocked_shots || 0,
        takeaways: editSession.takeaways || 0,
        giveaways: editSession.giveaways || 0,
        faceoff_wins: editSession.faceoff_wins || 0,
        faceoff_losses: editSession.faceoff_losses || 0,
        power_play_goals: editSession.power_play_goals || 0,
        power_play_points: editSession.power_play_points || 0,
        shorthanded_goals: editSession.shorthanded_goals || 0,
        shorthanded_points: editSession.shorthanded_points || 0,
        time_on_ice: editSession.time_on_ice || 0,
        rating: editSession.rating || 0,
        notes: editSession.notes || "",
        opponent: editSession.opponent || "",
        result: editSession.result || "",
        shifts: editSession.shifts || [],
      });
    }
  }, [editSession]);

  useEffect(() => {
    if (!editId && !form.date) {
      setForm((f) => ({ ...f, date: format(new Date(), "yyyy-MM-dd") }));
    }
  }, [editId, form.date]);

  useEffect(() => {
    if (profileId && !form.profile_id) {
      setForm((f) => ({ ...f, profile_id: profileId }));
    } else if (!profileId && profiles.length > 0 && !form.profile_id) {
      const savedProfileId = localStorage.getItem("activeProfileId");
      const savedProfile = profiles.find(p => p.id === savedProfileId);
      setForm((f) => ({ ...f, profile_id: savedProfile?.id || profiles[0].id }));
    }
  }, [profileId, profiles]);

  const saveDraft = () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    setSavedDraft(true);
    setTimeout(() => setSavedDraft(false), 2000);
  };

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
  };

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Session.create(data),
    onSuccess: () => {
      clearDraft();
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["sessions-profile"] });
      queryClient.invalidateQueries({ queryKey: ["seasons"] });
      setSaved(true);
      setTimeout(() => {
        navigate(createPageUrl("Home"));
      }, 800);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Session.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["sessions-profile"] });
      queryClient.invalidateQueries({ queryKey: ["seasons"] });
      setSaved(true);
      setTimeout(() => {
        navigate(createPageUrl("SessionDetail") + `?id=${editId}`);
      }, 800);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    let payload = {
      ...form,
      duration: form.duration ? parseInt(form.duration) : 0,
      date: form.date || format(new Date(), "yyyy-MM-dd"),
    };

    if (form.type === "shift_by_shift" && form.shifts.length > 0) {
      const aggregatedStats = form.shifts.reduce((acc, shift) => {
        if (shift.stats) {
          Object.keys(shift.stats).forEach(stat => {
            acc[stat] = (acc[stat] || 0) + (shift.stats[stat] || 0);
          });
        }
        return acc;
      }, {});
      
      const totalIceTimeSeconds = form.shifts.reduce((sum, shift) => sum + shift.duration_seconds, 0);
      const totalIceTimeMinutes = Math.round(totalIceTimeSeconds / 60);
      
      payload = { ...payload, ...aggregatedStats, time_on_ice: totalIceTimeMinutes };
    }

    if (editId) {
      updateMutation.mutate({ id: editId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  // Block logging if no season exists
  const seasonsLoaded = !!(form.profile_id); // seasons query is enabled when profile_id exists
  if (form.profile_id && seasons.length === 0 && !editId) {
    return (
      <div className="px-4">
        <div className="flex items-center gap-3 py-4">
          <button onClick={() => window.history.back()} className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-white font-bold text-lg">Log Session</h1>
        </div>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/20 flex items-center justify-center mb-4">
            <Trophy className="w-8 h-8 text-amber-400" />
          </div>
          <h3 className="text-white font-bold text-xl mb-2">No Season Found</h3>
          <p className="text-slate-400 text-sm mb-8 max-w-xs">You need to create a season before you can log any sessions.</p>
          <Button
            onClick={() => window.location.href = createPageUrl("SeasonSetup") + `?profileId=${form.profile_id}`}
            className="bg-amber-500 hover:bg-amber-600 text-white rounded-2xl px-6 py-3 font-semibold gap-2"
          >
            <Trophy className="w-4 h-4" />
            Create Season
          </Button>
        </div>
      </div>
    );
  }

  if (saved) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4 animate-in zoom-in-50 duration-300">
          <Check className="w-8 h-8 text-emerald-400" />
        </div>
        <h2 className="text-white font-bold text-xl">Saved!</h2>
      </div>
    );
  }

  return (
    <div className="px-4 pb-32">
      {/* Header */}
      <div className="flex items-center gap-3 py-4">
        <button onClick={() => window.history.back()} className="text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-white font-bold text-lg">{editId ? "Edit Session" : "Log Session"}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Session Type */}
        <div className="grid grid-cols-2 gap-2">
          {sessionTypes.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => update("type", t.value)}
                className={cn(
                  "flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all",
                  form.type === t.value
                    ? t.color + " border-current"
                    : "bg-slate-800/40 border-slate-700/50 text-slate-400"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Profile + Season Selection */}
        {profiles.length > 1 && (
          <div>
            <Label className="text-slate-400 text-xs mb-1.5 block">Profile</Label>
            <Select value={form.profile_id} onValueChange={(v) => update("profile_id", v)}>
              <SelectTrigger className="bg-slate-800/60 border-slate-700/50 text-white rounded-xl">
                <SelectValue placeholder="Select profile" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {profiles.map((p) => (
                  <SelectItem key={p.id} value={p.id} className="text-white focus:bg-slate-700">
                    {p.name} — {p.position}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {seasons.length > 0 && (
          <div>
            <Label className="text-slate-400 text-xs mb-1.5 block">Season</Label>
            <Select value={form.season_id} onValueChange={(v) => update("season_id", v)}>
              <SelectTrigger className="bg-slate-800/60 border-slate-700/50 text-white rounded-xl">
                <SelectValue placeholder="Select season" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {seasons.map((s) => (
                  <SelectItem key={s.id} value={s.id} className="text-white focus:bg-slate-700">
                    {s.season_year} {s.team_name && `— ${s.team_name}`} {s.is_active && "✓"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Date Display + Duration */}
         <div className="grid grid-cols-2 gap-3">
           <div>
             <Label className="text-slate-400 text-xs mb-1.5 block">Date</Label>
             <div className="bg-slate-800/60 border border-slate-700/50 text-white rounded-xl px-3 py-2.5 text-sm">
               {form.date ? format(new Date(form.date), "MMM d, yyyy") : "—"}
             </div>
           </div>
           <div>
             <Label className="text-slate-400 text-xs mb-1.5 block">Duration (min)</Label>
             <Input
               type="number"
               placeholder="60"
               value={form.duration}
               onChange={(e) => {
                 const val = parseInt(e.target.value);
                 if (isNaN(val)) {
                   update("duration", "");
                 } else if (val < 0) {
                   update("duration", "0");
                 } else {
                   update("duration", val.toString());
                 }
               }}
               min="0"
               className="bg-slate-800/60 border-slate-700/50 text-white rounded-xl"
             />
           </div>
         </div>

        {/* Game-specific fields */}
        {form.type === "game" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-400 text-xs mb-1.5 block">Opponent</Label>
                <Input
                  placeholder="Team name"
                  value={form.opponent}
                  onChange={(e) => update("opponent", e.target.value)}
                  className="bg-slate-800/60 border-slate-700/50 text-white rounded-xl"
                />
              </div>
              <div>
                <Label className="text-slate-400 text-xs mb-1.5 block">Result</Label>
                <Select value={form.result} onValueChange={(v) => update("result", v)}>
                  <SelectTrigger className="bg-slate-800/60 border-slate-700/50 text-white rounded-xl">
                    <SelectValue placeholder="Result" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="win" className="text-white focus:bg-slate-700">Win</SelectItem>
                    <SelectItem value="loss" className="text-white focus:bg-slate-700">Loss</SelectItem>
                    <SelectItem value="tie" className="text-white focus:bg-slate-700">Tie</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Scoring */}
            {(selectedStats.includes("goals") || selectedStats.includes("assists") || selectedStats.includes("shots") || selectedStats.includes("plus_minus")) && (
              <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
                <h3 className="text-white font-semibold text-sm mb-3">Scoring</h3>
                <div className="grid grid-cols-2 gap-3">
                  {selectedStats.includes("goals") && (
                    <StatControl label="Goals" value={form.goals} onChange={(v) => update("goals", v)} color="text-sky-400" />
                  )}
                  {selectedStats.includes("assists") && (
                    <StatControl label="Assists" value={form.assists} onChange={(v) => update("assists", v)} color="text-emerald-400" />
                  )}
                  {selectedStats.includes("shots") && (
                    <StatControl label="Shots" value={form.shots} onChange={(v) => update("shots", v)} />
                  )}
                  {selectedStats.includes("plus_minus") && (
                    <StatControl label="+/-" value={form.plus_minus} onChange={(v) => update("plus_minus", v)} 
                      color={form.plus_minus >= 0 ? "text-emerald-400" : "text-red-400"} allowNegative={true} />
                  )}
                </div>
              </div>
            )}

            {/* Defensive */}
            {(selectedStats.includes("hits") || selectedStats.includes("blocked_shots") || selectedStats.includes("takeaways")) && (
              <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
                <h3 className="text-white font-semibold text-sm mb-3">Defensive</h3>
                <div className="grid grid-cols-2 gap-3">
                  {selectedStats.includes("blocked_shots") && (
                    <StatControl label="Blocks" value={form.blocked_shots} onChange={(v) => update("blocked_shots", v)} />
                  )}
                  {selectedStats.includes("hits") && (
                    <StatControl label="Hits" value={form.hits} onChange={(v) => update("hits", v)} />
                  )}
                  {selectedStats.includes("takeaways") && (
                    <StatControl label="Takeaways" value={form.takeaways} onChange={(v) => update("takeaways", v)} color="text-emerald-400" />
                  )}
                </div>
              </div>
            )}

            {/* Discipline */}
            {(selectedStats.includes("penalty_minutes") || selectedStats.includes("giveaways")) && (
              <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
                <h3 className="text-white font-semibold text-sm mb-3">Discipline</h3>
                <div className="grid grid-cols-2 gap-3">
                  {selectedStats.includes("penalty_minutes") && (
                    <StatControl label="Penalty Min" value={form.penalty_minutes} onChange={(v) => update("penalty_minutes", v)} color="text-red-400" />
                  )}
                  {selectedStats.includes("giveaways") && (
                    <StatControl label="Giveaways" value={form.giveaways} onChange={(v) => update("giveaways", v)} color="text-red-400" />
                  )}
                </div>
              </div>
            )}

            {/* Advanced Stats */}
            {(selectedStats.includes("faceoff_percentage") || selectedStats.includes("power_play_goals") || selectedStats.includes("power_play_points") || selectedStats.includes("shorthanded_goals") || selectedStats.includes("shorthanded_points")) && (
              <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
                <h3 className="text-white font-semibold text-sm mb-3">Advanced Stats</h3>
                <div className="grid grid-cols-2 gap-3">
                  {selectedStats.includes("faceoff_percentage") && (
                    <>
                      <StatControl label="FO Won" value={form.faceoff_wins} onChange={(v) => update("faceoff_wins", v)} color="text-emerald-400" />
                      <StatControl label="FO Lost" value={form.faceoff_losses} onChange={(v) => update("faceoff_losses", v)} color="text-red-400" />
                    </>
                  )}
                  {selectedStats.includes("power_play_goals") && (
                    <StatControl label="PPG" value={form.power_play_goals} onChange={(v) => update("power_play_goals", v)} color="text-sky-400" />
                  )}
                  {selectedStats.includes("power_play_points") && (
                    <StatControl label="PPP" value={form.power_play_points} onChange={(v) => update("power_play_points", v)} color="text-sky-400" />
                  )}
                  {selectedStats.includes("shorthanded_goals") && (
                    <StatControl label="SHG" value={form.shorthanded_goals} onChange={(v) => update("shorthanded_goals", v)} color="text-emerald-400" />
                  )}
                  {selectedStats.includes("shorthanded_points") && (
                    <StatControl label="SHP" value={form.shorthanded_points} onChange={(v) => update("shorthanded_points", v)} color="text-emerald-400" />
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Shift by Shift - Opponent / Result / Period */}
        {form.type === "shift_by_shift" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-400 text-xs mb-1.5 block">Opponent</Label>
                <Input
                  placeholder="Team name"
                  value={form.opponent}
                  onChange={(e) => update("opponent", e.target.value)}
                  className="bg-slate-800/60 border-slate-700/50 text-white rounded-xl"
                />
              </div>
              <div>
                <Label className="text-slate-400 text-xs mb-1.5 block">Result</Label>
                <Select value={form.result} onValueChange={(v) => update("result", v)}>
                  <SelectTrigger className="bg-slate-800/60 border-slate-700/50 text-white rounded-xl">
                    <SelectValue placeholder="Result" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="win" className="text-white focus:bg-slate-700">Win</SelectItem>
                    <SelectItem value="loss" className="text-white focus:bg-slate-700">Loss</SelectItem>
                    <SelectItem value="tie" className="text-white focus:bg-slate-700">Tie</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-slate-400 text-xs mb-1.5 block">Period</Label>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setCurrentPeriod(p)}
                    className={cn(
                      "py-2 rounded-xl border text-sm font-semibold transition-all",
                      currentPeriod === p
                        ? "bg-amber-500/20 text-amber-400 border-amber-500/50"
                        : "bg-slate-800/40 border-slate-700/50 text-slate-400"
                    )}
                  >
                    {p === 1 ? "1st" : p === 2 ? "2nd" : "3rd"}
                  </button>
                ))}
              </div>
            </div>

            <ShiftTimer
              shifts={form.shifts}
              onShiftsChange={(s) => update("shifts", s)}
              selectedStats={selectedStats}
              currentPeriod={currentPeriod}
            />
          </>
        )}

        {/* Rating */}
        {selectedStats.includes("rating") && (
          <div>
            <Label className="text-slate-400 text-xs mb-2 block">How'd it go?</Label>
            <StarRating value={form.rating} onChange={(v) => update("rating", v)} size="lg" />
          </div>
        )}

        {/* Notes */}
        <div>
          <Label className="text-slate-400 text-xs mb-1.5 block">Notes</Label>
          <Textarea
            placeholder="Quick thoughts..."
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            rows={3}
            className="bg-slate-800/60 border-slate-700/50 text-white rounded-xl resize-none"
          />
        </div>

        {/* Save Draft (shift_by_shift only) */}
        {form.type === "shift_by_shift" && !editId && (
          <Button
            type="button"
            onClick={saveDraft}
            variant="outline"
            className="w-full border-slate-600 text-slate-300 hover:bg-slate-800 rounded-xl h-12 text-base font-semibold gap-2"
          >
            <Save className="w-4 h-4" />
            {savedDraft ? "Draft Saved!" : "Save Progress"}
          </Button>
        )}

        {/* Submit */}
        <Button
          type="submit"
          disabled={isSubmitting || !form.profile_id}
          className="w-full bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-xl h-12 text-base"
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : editId ? (
            "Save Changes"
          ) : (
            "Log Session"
          )}
        </Button>
      </form>
    </div>
  );
}