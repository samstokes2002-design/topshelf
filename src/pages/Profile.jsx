import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User, Settings, UserCog, ChevronRight, Trophy, Target, Dumbbell, Calendar, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import SessionCard from "@/components/SessionCard";
import ProfileSwitcher from "@/components/ProfileSwitcher";
import SeasonStats from "@/components/SeasonStats";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Profile() {
  const [activeProfile, setActiveProfile] = useState(null);
  const [filter, setFilter] = useState("all");
  const [selectedSeasonId, setSelectedSeasonId] = useState(null);

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

  const handleProfileSwitch = (profile) => {
    setActiveProfile(profile);
    localStorage.setItem("activeProfileId", profile.id);
    setSelectedSeasonId(null);
  };

  const activeSeason = seasons.find((s) => s.is_active);
  
  const currentSeasonSessions = activeSeason
    ? sessions.filter((s) => {
        const sessionDate = new Date(s.date);
        const seasonStart = new Date(activeSeason.created_date);
        const seasonIndex = seasons.findIndex((se) => se.id === activeSeason.id);
        const nextSeason = seasons[seasonIndex - 1];
        const seasonEnd = nextSeason ? new Date(nextSeason.created_date) : new Date();
        return sessionDate >= seasonStart && sessionDate < seasonEnd;
      })
    : sessions;

  const selectedSeason = selectedSeasonId
    ? seasons.find((s) => s.id === selectedSeasonId)
    : null;

  const selectedSeasonSessions = selectedSeason
    ? sessions.filter((s) => {
        const sessionDate = new Date(s.date);
        const seasonStart = new Date(selectedSeason.created_date);
        const seasonIndex = seasons.findIndex((se) => se.id === selectedSeason.id);
        const nextSeason = seasons[seasonIndex - 1];
        const seasonEnd = nextSeason ? new Date(nextSeason.created_date) : new Date();
        return sessionDate >= seasonStart && sessionDate < seasonEnd;
      })
    : [];

  const filteredSessions = filter === "all"
    ? currentSeasonSessions
    : currentSeasonSessions.filter((s) => s.type === filter);

  const games = currentSeasonSessions.filter((s) => s.type === "game");
  const totalGoals = games.reduce((s, g) => s + (g.goals || 0), 0);
  const totalAssists = games.reduce((s, g) => s + (g.assists || 0), 0);
  const totalPoints = totalGoals + totalAssists;

  if (!activeProfile) return null;

  return (
    <div className="px-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between py-4">
        <h1 className="text-white font-bold text-xl">Profile</h1>
        <div className="flex gap-2">
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
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-2xl bg-sky-500/20 flex items-center justify-center overflow-hidden">
            {activeProfile.photo_url ? (
              <img src={activeProfile.photo_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <User className="w-7 h-7 text-sky-400" />
            )}
          </div>
          <div>
            <h2 className="text-white font-bold text-lg">{activeProfile.name}</h2>
            <p className="text-slate-400 text-sm">{activeProfile.position}</p>
            {activeProfile.age && <p className="text-slate-500 text-xs">Age {activeProfile.age}</p>}
          </div>
        </div>

        {profiles.length > 1 && (
          <ProfileSwitcher
            profiles={profiles}
            activeProfile={activeProfile}
            onSwitch={handleProfileSwitch}
            onAdd={() => window.location.href = createPageUrl("CreateProfile")}
          />
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
              const seasonSessions = sessions.filter((s) => {
                const sessionDate = new Date(s.date);
                const seasonStart = new Date(season.created_date);
                const seasonIndex = seasons.findIndex((se) => se.id === season.id);
                const nextSeason = seasons[seasonIndex - 1];
                const seasonEnd = nextSeason ? new Date(nextSeason.created_date) : new Date();
                return sessionDate >= seasonStart && sessionDate < seasonEnd;
              });
              const seasonGames = seasonSessions.filter((s) => s.type === "game");
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
                  <div className="flex gap-4 text-xs">
                    <span className="text-slate-400">{seasonGames.length} Games</span>
                    <span className="text-slate-400">{seasonPractices.length} Practices</span>
                    <span className="text-slate-400">{seasonTraining.length} Training</span>
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

      {/* Session Filters */}
      <Tabs value={filter} onValueChange={setFilter} className="mb-4">
        <TabsList className="bg-slate-800/60 border border-slate-700/50 w-full">
          <TabsTrigger value="all" className="flex-1 data-[state=active]:bg-slate-700 text-xs">All</TabsTrigger>
          <TabsTrigger value="game" className="flex-1 data-[state=active]:bg-slate-700 text-xs">Games</TabsTrigger>
          <TabsTrigger value="practice" className="flex-1 data-[state=active]:bg-slate-700 text-xs">Practice</TabsTrigger>
          <TabsTrigger value="training" className="flex-1 data-[state=active]:bg-slate-700 text-xs">Training</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Session History */}
      <div className="space-y-3">
        {isLoading ? (
          [1, 2, 3].map((i) => <div key={i} className="bg-slate-800/40 rounded-2xl h-24 animate-pulse" />)
        ) : filteredSessions.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">No sessions found</div>
        ) : (
          filteredSessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onClick={() => window.location.href = createPageUrl("SessionDetail") + `?id=${session.id}`}
            />
          ))
        )}
      </div>
    </div>
  );
}