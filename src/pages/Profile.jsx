import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User, Settings, UserCog, Trophy, Plus, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProfileSwitcher from "@/components/ProfileSwitcher";
import SeasonStats from "@/components/SeasonStats";
import SeasonTargets from "@/components/SeasonTargets";
import { useSubscription } from "@/hooks/useSubscription";

export default function Profile() {
  const [activeProfile, setActiveProfile] = useState(null);
  const [selectedSeasonId, setSelectedSeasonId] = useState(null);
  const queryClient = useQueryClient();
  const { isPro } = useSubscription();

  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return base44.entities.Profile.filter({ created_by: currentUser.email }, "-created_date");
    },
  });

  const { data: seasons = [] } = useQuery({
    queryKey: ["seasons", activeProfile?.id],
    queryFn: () =>
      activeProfile
        ? base44.entities.Season.filter({ profile_id: activeProfile.id }, "-created_date")
        : [],
    enabled: !!activeProfile,
  });

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["sessions-profile", activeProfile?.id],
    queryFn: () =>
      activeProfile
        ? base44.entities.Session.filter({ profile_id: activeProfile.id }, "-date", 200)
        : [],
    enabled: !!activeProfile,
  });

  useEffect(() => {
    if (profiles.length > 0 && !activeProfile) {
      const savedProfileId = localStorage.getItem("activeProfileId");
      const savedProfile = profiles.find(p => p.id === savedProfileId);
      setActiveProfile(savedProfile || profiles[0]);
    }
  }, [profiles, activeProfile]);

  // Real-time subscription: refetch sessions immediately when any session is created/updated
  useEffect(() => {
    if (!activeProfile) return;
    const unsubscribe = base44.entities.Session.subscribe((event) => {
      if (event.type === "create" || event.type === "update") {
        queryClient.invalidateQueries({ queryKey: ["sessions-profile", activeProfile.id] });
        queryClient.invalidateQueries({ queryKey: ["seasons", activeProfile.id] });
      }
    });
    return unsubscribe;
  }, [activeProfile, queryClient]);

  const handleProfileSwitch = (profile) => {
    setActiveProfile(profile);
    localStorage.setItem("activeProfileId", profile.id);
    setSelectedSeasonId(null);
  };

  const activeSeason = seasons.find((s) => s.is_active);

  // Filter sessions by season_id (set when logged). Fall back to profile-wide for legacy sessions without season_id.
  const getSessionsForSeason = (season) => {
    const byId = sessions.filter((s) => s.season_id === season.id);
    if (byId.length > 0) return byId;
    // Legacy fallback: sessions that don't have any season_id at all
    return sessions.filter((s) => !s.season_id);
  };

  const currentSeasonSessions = activeSeason ? getSessionsForSeason(activeSeason) : sessions;

  const selectedSeason = selectedSeasonId ? seasons.find((s) => s.id === selectedSeasonId) : null;
  const selectedSeasonSessions = selectedSeason ? getSessionsForSeason(selectedSeason) : [];

  const games = currentSeasonSessions.filter((s) => s.type === "game" || s.type === "shift_by_shift");
  const totalGoals = games.reduce((sum, g) => sum + (g.goals || 0), 0);
  const totalAssists = games.reduce((sum, g) => sum + (g.assists || 0), 0);
  const totalPoints = totalGoals + totalAssists;

  if (!activeProfile) return null;

  return (
    <div className="px-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between py-4">
        <h1 className="text-white font-bold text-xl">Profile</h1>
        <div className="flex gap-2">
          <Link to={createPageUrl("Plans")} className="text-amber-400 hover:text-amber-300 transition-colors" title="Plans">
            <Crown className="w-5 h-5" />
          </Link>
          <Link to={createPageUrl("EditProfile") + `?id=${activeProfile?.id}`} className="text-slate-400 hover:text-white transition-colors">
            <UserCog className="w-5 h-5" />
          </Link>
          <Link to={createPageUrl("Settings")} className="text-slate-400 hover:text-white transition-colors">
            <Settings className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 mb-5">
        {/* Photo + Name + Position */}
        <div className="flex items-start gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-sky-500/20 flex items-center justify-center overflow-hidden flex-shrink-0">
            {activeProfile.photo_url ? (
              <img src={activeProfile.photo_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <User className="w-7 h-7 text-sky-400" />
            )}
          </div>
          <div className="flex-1">
            {profiles.length > 1 ? (
              <ProfileSwitcher
                profiles={profiles}
                activeProfile={activeProfile}
                onSwitch={handleProfileSwitch}
                onAdd={() => window.location.href = createPageUrl("CreateProfile")}
                inline
              />
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-white font-bold text-lg">{activeProfile.name}</h2>
                {activeProfile.player_number && <span className="text-sky-400 font-bold text-lg">#{activeProfile.player_number}</span>}
                {isPro && (
                  <span className="flex items-center gap-1 bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    <Crown className="w-2.5 h-2.5" /> PRO
                  </span>
                )}
              </div>
            )}
            <p className="text-slate-400 text-sm">{activeProfile.position}</p>
          </div>
        </div>

        {/* Detailed Info — only when show_on_profile is on and has content */}
        {activeProfile.show_on_profile && activeProfile.favorite_team && activeProfile.favorite_team !== "none" && (
          <div className="border-t border-slate-700/50 pt-4 space-y-3">
            <div>
              <p className="text-slate-500 text-xs mb-0.5">Favourite Team</p>
              <p className="text-white text-sm">{activeProfile.favorite_team}</p>
            </div>
          </div>
        )}

        {/* Age/Height/Weight Stats */}
        {(activeProfile.age || activeProfile.height || activeProfile.weight) && (
          <div className="mt-4 pt-4 border-t border-slate-700/50">
            <div className="flex gap-4">
              {activeProfile.age && (
                <div className="text-center flex-1">
                  <p className="text-white text-sm font-medium">{activeProfile.age}</p>
                  <p className="text-slate-500 text-[10px]">Age</p>
                </div>
              )}
              {activeProfile.height && (
                <div className="text-center flex-1">
                  <p className="text-white text-sm font-medium">{activeProfile.height}</p>
                  <p className="text-slate-500 text-[10px]">Height</p>
                </div>
              )}
              {activeProfile.weight && (
                <div className="text-center flex-1">
                  <p className="text-white text-sm font-medium">{activeProfile.weight} lbs</p>
                  <p className="text-slate-500 text-[10px]">Weight</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Current Season Totals */}
        {activeSeason && (
          <div className="mt-4 pt-4 border-t border-slate-700/50">
            <p className="text-xs text-slate-400 mb-2">Current Season</p>
            <div className="grid grid-cols-4 gap-3">
              <div className="text-center">
                <span className="text-lg font-bold text-white">{games.length}</span>
                <span className="text-[10px] text-slate-400 block">GP</span>
              </div>
              <div className="text-center">
                <span className="text-lg font-bold text-sky-400">{totalGoals}</span>
                <span className="text-[10px] text-slate-400 block">G</span>
              </div>
              <div className="text-center">
                <span className="text-lg font-bold text-emerald-400">{totalAssists}</span>
                <span className="text-[10px] text-slate-400 block">A</span>
              </div>
              <div className="text-center">
                <span className="text-lg font-bold text-white">{totalPoints}</span>
                <span className="text-[10px] text-slate-400 block">PTS</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* No Season CTA */}
      {seasons.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/20 flex items-center justify-center mb-4">
            <Trophy className="w-8 h-8 text-amber-400" />
          </div>
          <h3 className="text-white font-bold text-lg mb-2">No Season Yet</h3>
          <p className="text-slate-400 text-sm mb-6 max-w-xs">Create a season to start tracking your stats and progress throughout the year.</p>
          <Button
            onClick={() => window.location.href = createPageUrl("SeasonSetup") + `?profileId=${activeProfile?.id || ""}`}
            className="bg-amber-500 hover:bg-amber-600 text-white rounded-2xl px-6 py-3 font-semibold gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Season
          </Button>
        </div>
      )}

      {/* Seasons List */}
      {seasons.length > 0 && (
        <div className="mb-5">
          <h3 className="text-white font-semibold text-sm mb-3">Seasons</h3>
          <div className="space-y-2">
            {seasons.map((season) => {
              const seasonSessions = getSessionsForSeason(season);
              const seasonGames = seasonSessions.filter((s) => s.type === "game" || s.type === "shift_by_shift");
              const seasonPractices = seasonSessions.filter((s) => s.type === "practice");
              const seasonTraining = seasonSessions.filter((s) => s.type === "training");

              return (
                <button
                  key={season.id}
                  onClick={() => setSelectedSeasonId(selectedSeasonId === season.id ? null : season.id)}
                  className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 hover:bg-slate-700/60 transition-colors text-left"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="text-white font-medium text-sm">{season.season_year}</h4>
                      {season.team_name && <p className="text-slate-400 text-xs">{season.team_name}</p>}
                    </div>
                    {season.is_active && (
                      <span className="text-[10px] bg-sky-500/20 text-sky-400 px-2 py-0.5 rounded-full">Active</span>
                    )}
                  </div>
                  <div className="flex gap-4 text-xs flex-wrap">
                    <span className="text-slate-400">{seasonGames.length} Games</span>
                    <span className="text-slate-400">{seasonPractices.length} Practices</span>
                    <span className="text-slate-400">{seasonTraining.length} Training</span>
                    {season.targets_total > 0 && (
                      <span className={`flex items-center gap-1 font-medium ${season.targets_completed === season.targets_total ? "text-emerald-400" : "text-sky-400"}`}>
                        🎯 {season.targets_completed}/{season.targets_total} targets
                      </span>
                    )}
                  </div>
                  {selectedSeasonId === season.id && (
                    <SeasonStats sessions={seasonSessions} selectedStats={season.selected_stats} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Season Targets */}
      {activeSeason && (
        <SeasonTargets
          profileId={activeProfile.id}
          seasonId={activeSeason.id}
          sessions={currentSeasonSessions}
          isPro={isPro}
        />
      )}
    </div>
  );
}