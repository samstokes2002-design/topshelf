import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Trophy, Target, Dumbbell, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import StarRating from "@/components/ui/StarRating";
import ShiftTimer from "@/components/ShiftTimer";

const sessionTypes = [
  { value: "game", label: "Game", icon: Trophy, color: "bg-sky-500/20 text-sky-400 border-sky-500/30" },
  { value: "practice", label: "Practice", icon: Target, color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  { value: "training", label: "Training", icon: Dumbbell, color: "bg-violet-500/20 text-violet-400 border-violet-500/30" },
];

export default function LogSession() {
  const urlParams = new URLSearchParams(window.location.search);
  const profileId = urlParams.get("profileId");
  const editId = urlParams.get("editId");
  const queryClient = useQueryClient();

  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    profile_id: profileId || "",
    date: format(new Date(), "yyyy-MM-dd"),
    type: "game",
    duration: "",
    goals: "",
    assists: "",
    shots: "",
    plus_minus: "",
    rating: 0,
    notes: "",
    opponent: "",
    result: "",
    shifts: [],
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles"],
    queryFn: () => base44.entities.Profile.list("-created_date"),
  });

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
        goals: editSession.goals?.toString() || "",
        assists: editSession.assists?.toString() || "",
        shots: editSession.shots?.toString() || "",
        plus_minus: editSession.plus_minus?.toString() || "",
        rating: editSession.rating || 0,
        notes: editSession.notes || "",
        opponent: editSession.opponent || "",
        result: editSession.result || "",
        shifts: editSession.shifts || [],
      });
    }
  }, [editSession]);

  useEffect(() => {
    if (profileId && !form.profile_id) {
      setForm((f) => ({ ...f, profile_id: profileId }));
    }
  }, [profileId]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Session.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      setSaved(true);
      setTimeout(() => {
        window.location.href = createPageUrl("Home");
      }, 800);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Session.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      setSaved(true);
      setTimeout(() => {
        window.location.href = createPageUrl("SessionDetail") + `?id=${editId}`;
      }, 800);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      duration: form.duration ? parseInt(form.duration) : 0,
      goals: form.goals ? parseInt(form.goals) : 0,
      assists: form.assists ? parseInt(form.assists) : 0,
      shots: form.shots ? parseInt(form.shots) : 0,
      plus_minus: form.plus_minus ? parseInt(form.plus_minus) : 0,
    };

    if (editId) {
      updateMutation.mutate({ id: editId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

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
    <div className="px-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 py-4">
        <button onClick={() => window.history.back()} className="text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-white font-bold text-lg">{editId ? "Edit Session" : "Log Session"}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Session Type */}
        <div className="grid grid-cols-3 gap-2">
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

        {/* Profile + Date */}
        <div className="grid grid-cols-2 gap-3">
          {profiles.length > 1 && (
            <div className="col-span-2">
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
          <div>
            <Label className="text-slate-400 text-xs mb-1.5 block">Date</Label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => update("date", e.target.value)}
              className="bg-slate-800/60 border-slate-700/50 text-white rounded-xl"
            />
          </div>
          <div>
            <Label className="text-slate-400 text-xs mb-1.5 block">Duration (min)</Label>
            <Input
              type="number"
              placeholder="60"
              value={form.duration}
              onChange={(e) => update("duration", e.target.value)}
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

            {/* Stats row */}
            <div className="grid grid-cols-4 gap-2">
              <div>
                <Label className="text-slate-400 text-[10px] mb-1 block text-center">Goals</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={form.goals}
                  onChange={(e) => update("goals", e.target.value)}
                  className="bg-slate-800/60 border-slate-700/50 text-white rounded-xl text-center"
                />
              </div>
              <div>
                <Label className="text-slate-400 text-[10px] mb-1 block text-center">Assists</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={form.assists}
                  onChange={(e) => update("assists", e.target.value)}
                  className="bg-slate-800/60 border-slate-700/50 text-white rounded-xl text-center"
                />
              </div>
              <div>
                <Label className="text-slate-400 text-[10px] mb-1 block text-center">Shots</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={form.shots}
                  onChange={(e) => update("shots", e.target.value)}
                  className="bg-slate-800/60 border-slate-700/50 text-white rounded-xl text-center"
                />
              </div>
              <div>
                <Label className="text-slate-400 text-[10px] mb-1 block text-center">+/-</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={form.plus_minus}
                  onChange={(e) => update("plus_minus", e.target.value)}
                  className="bg-slate-800/60 border-slate-700/50 text-white rounded-xl text-center"
                />
              </div>
            </div>
          </>
        )}

        {/* Shift Timer */}
        <ShiftTimer shifts={form.shifts} onShiftsChange={(s) => update("shifts", s)} />

        {/* Rating */}
        <div>
          <Label className="text-slate-400 text-xs mb-2 block">How'd it go?</Label>
          <StarRating value={form.rating} onChange={(v) => update("rating", v)} size="lg" />
        </div>

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