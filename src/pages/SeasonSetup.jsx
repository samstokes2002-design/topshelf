import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Trophy, Check } from "lucide-react";

const AVAILABLE_STATS = [
  { id: "goals", label: "Goals", category: "scoring" },
  { id: "assists", label: "Assists", category: "scoring" },
  { id: "shots", label: "Shots", category: "scoring" },
  { id: "plus_minus", label: "Plus/Minus (+/-)", category: "overall" },
  { id: "penalty_minutes", label: "Penalty Minutes (PIM)", category: "discipline" },
  { id: "hits", label: "Hits", category: "physical" },
  { id: "blocked_shots", label: "Blocked Shots", category: "defense" },
  { id: "takeaways", label: "Takeaways", category: "defense" },
  { id: "giveaways", label: "Giveaways", category: "defense" },
  { id: "faceoff_percentage", label: "Faceoff % (FO%)", category: "special" },
  { id: "power_play_goals", label: "Power Play Goals (PPG)", category: "special" },
  { id: "power_play_points", label: "Power Play Points (PPP)", category: "special" },
  { id: "shorthanded_goals", label: "Shorthanded Goals (SHG)", category: "special" },
  { id: "shorthanded_points", label: "Shorthanded Points (SHP)", category: "special" },
  { id: "time_on_ice", label: "Time on Ice (TOI)", category: "special" },
  { id: "rating", label: "Performance Rating (1-5 stars)", category: "overall" },
];

const SEASON_TYPES = [
  { value: "winter", label: "Winter (2025-2026)", format: (year) => `${year}-${year + 1}` },
  { value: "spring", label: "Spring", format: (year) => `Spring ${year}` },
  { value: "summer", label: "Summer", format: (year) => `Summer ${year}` },
  { value: "fall", label: "Fall", format: (year) => `Fall ${year}` },
];

export default function SeasonSetup() {
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const profileId = urlParams.get("profileId");
  const editId = urlParams.get("editId");

  const [step, setStep] = useState(1);
  const [seasonType, setSeasonType] = useState("winter");
  const [year, setYear] = useState(new Date().getFullYear());
  const [teamName, setTeamName] = useState("");
  const [selectedStats, setSelectedStats] = useState([
    "goals", "assists", "shots", "plus_minus", "rating"
  ]);
  const [saved, setSaved] = useState(false);

  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return base44.entities.Profile.filter({ created_by: currentUser.email });
    },
  });

  const { data: editSeason } = useQuery({
    queryKey: ["season-edit", editId],
    queryFn: async () => {
      const seasons = await base44.entities.Season.filter({ id: editId });
      return seasons[0];
    },
    enabled: !!editId,
  });

  React.useEffect(() => {
    if (editSeason) {
      setTeamName(editSeason.team_name || "");
      setSelectedStats(editSeason.selected_stats || []);
      // Parse season year to detect type
      const sy = editSeason.season_year;
      if (sy.includes("-") && sy.split("-").length === 2) {
        setSeasonType("winter");
        setYear(parseInt(sy.split("-")[0]));
      } else if (sy.startsWith("Spring")) {
        setSeasonType("spring");
        setYear(parseInt(sy.split(" ")[1]));
      } else if (sy.startsWith("Summer")) {
        setSeasonType("summer");
        setYear(parseInt(sy.split(" ")[1]));
      } else if (sy.startsWith("Fall")) {
        setSeasonType("fall");
        setYear(parseInt(sy.split(" ")[1]));
      }
    }
  }, [editSeason]);

  const createMutation = useMutation({
    mutationFn: async (data) => {
      // Deactivate other seasons for this profile
      const existingSeasons = await base44.entities.Season.filter({ 
        profile_id: profileId || profiles[0]?.id 
      });
      for (const season of existingSeasons) {
        await base44.entities.Season.update(season.id, { is_active: false });
      }
      return base44.entities.Season.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seasons"] });
      queryClient.invalidateQueries({ queryKey: ["activeSeason"] });
      setSaved(true);
      setTimeout(() => {
        window.location.href = createPageUrl("Profile");
      }, 1000);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Season.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seasons"] });
      queryClient.invalidateQueries({ queryKey: ["activeSeason"] });
      setSaved(true);
      setTimeout(() => {
        window.location.href = createPageUrl("Profile");
      }, 1000);
    },
  });

  const toggleStat = (statId) => {
    setSelectedStats((prev) =>
      prev.includes(statId) ? prev.filter((s) => s !== statId) : [...prev, statId]
    );
  };

  const selectAllInCategory = (category) => {
    const categoryStatIds = AVAILABLE_STATS.filter((s) => s.category === category).map((s) => s.id);
    const allSelected = categoryStatIds.every((id) => selectedStats.includes(id));
    
    if (allSelected) {
      // Deselect all in category
      setSelectedStats((prev) => prev.filter((id) => !categoryStatIds.includes(id)));
    } else {
      // Select all in category
      setSelectedStats((prev) => [...new Set([...prev, ...categoryStatIds])]);
    }
  };

  const handleSubmit = () => {
    const selectedType = SEASON_TYPES.find((t) => t.value === seasonType);
    const seasonYear = selectedType.format(year);

    const payload = {
      profile_id: editId ? (editSeason?.profile_id || profileId || profiles[0]?.id) : (profileId || profiles[0]?.id),
      season_year: seasonYear,
      team_name: teamName,
      selected_stats: selectedStats,
      is_active: true,
    };

    if (editId) {
      updateMutation.mutate({ id: editId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  if (saved) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <div className="w-16 h-16 rounded-full bg-sky-500/20 flex items-center justify-center mb-4 animate-in zoom-in-50">
          <Check className="w-8 h-8 text-sky-400" />
        </div>
        <h2 className="text-white font-bold text-xl">Season Ready!</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 px-4 py-8 pb-32">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-sky-500/20 flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-sky-400" />
          </div>
          <h1 className="text-white font-bold text-2xl mb-2">
            {editId ? "Edit Season" : "Season Setup"}
          </h1>
          <p className="text-slate-400 text-sm">
            {step === 1 ? "Let's set up your season details" : "Choose the stats you want to track"}
          </p>
        </div>

        {/* Progress */}
        {!editId && (
          <div className="flex gap-2 mb-8">
            {[1, 2].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full ${
                  s <= step ? "bg-sky-500" : "bg-slate-700"
                }`}
              />
            ))}
          </div>
        )}

        {/* Step 1: Season Details */}
        {(step === 1 || editId) && (
          <div className="space-y-5 mb-8">
            <div>
              <Label className="text-slate-400 text-xs mb-2 block">Season Type</Label>
              <div className="grid grid-cols-2 gap-2">
                {SEASON_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setSeasonType(type.value)}
                    className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                      seasonType === type.value
                        ? "bg-sky-500/20 text-sky-400 border-sky-500/50"
                        : "bg-slate-800/60 border-slate-700/50 text-slate-400"
                    }`}
                  >
                    {type.label.split(" ")[0]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-slate-400 text-xs mb-2 block">Year</Label>
              <Input
                type="number"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value) || new Date().getFullYear())}
                className="bg-slate-800/60 border-slate-700/50 text-white rounded-xl"
              />
              <p className="text-slate-500 text-xs mt-1">
                Season: {SEASON_TYPES.find((t) => t.value === seasonType)?.format(year)}
              </p>
            </div>

            <div>
              <Label className="text-slate-400 text-xs mb-2 block">Team Name (Optional)</Label>
              <Input
                placeholder="e.g., Thunder AAA"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="bg-slate-800/60 border-slate-700/50 text-white rounded-xl"
              />
            </div>
          </div>
        )}

        {/* Step 2: Stat Selection */}
        {(step === 2 || editId) && (
          <div className="space-y-4 mb-8">
            <p className="text-slate-400 text-xs">
              Select the stats you want to track this season. You can change these later.
            </p>
            {["scoring", "overall", "physical", "defense", "discipline", "special"].map((category) => {
              const categoryStats = AVAILABLE_STATS.filter((s) => s.category === category);
              if (categoryStats.length === 0) return null;
              const allSelected = categoryStats.every((s) => selectedStats.includes(s.id));
              return (
                <div key={category} className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white font-semibold text-xs uppercase tracking-wider">
                      {category}
                    </h3>
                    <button
                      type="button"
                      onClick={() => selectAllInCategory(category)}
                      className="text-xs text-sky-400 hover:text-sky-300 font-medium"
                    >
                      {allSelected ? "Deselect All" : "Select All"}
                    </button>
                  </div>
                  <div className="space-y-2">
                    {categoryStats.map((stat) => (
                      <label
                        key={stat.id}
                        className="flex items-center gap-3 cursor-pointer hover:bg-slate-700/30 p-2 rounded-lg transition-colors"
                      >
                        <Checkbox
                          checked={selectedStats.includes(stat.id)}
                          onCheckedChange={() => toggleStat(stat.id)}
                          className="border-slate-600"
                        />
                        <span className="text-white text-sm">{stat.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {editId && (
            <Button
              onClick={() => window.location.href = createPageUrl("Settings")}
              variant="outline"
              className="flex-1 bg-slate-800/60 border-slate-700/50 text-white hover:bg-slate-800 rounded-xl h-12"
            >
              Cancel
            </Button>
          )}
          {step === 2 && !editId && (
            <Button
              onClick={() => setStep(1)}
              variant="outline"
              className="flex-1 bg-slate-800/60 border-slate-700/50 text-white hover:bg-slate-800 rounded-xl h-12"
            >
              Back
            </Button>
          )}
          <Button
            onClick={() => {
              if (step === 1 && !editId) {
                setStep(2);
              } else {
                handleSubmit();
              }
            }}
            disabled={isSubmitting || selectedStats.length === 0}
            className="flex-1 bg-sky-500 hover:bg-sky-600 text-white rounded-xl h-12 font-semibold"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : editId ? (
              "Save Changes"
            ) : step === 1 ? (
              "Next"
            ) : (
              "Start Season"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}