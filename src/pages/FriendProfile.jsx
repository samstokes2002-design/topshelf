import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, User } from "lucide-react";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";
import SessionCard from "@/components/SessionCard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

export default function FriendProfile() {
  const urlParams = new URLSearchParams(window.location.search);
  const profileId = urlParams.get("id");
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["friend-profile", profileId],
    queryFn: () => base44.asServiceRole.entities.Profile.get(profileId),
    enabled: !!profileId,
  });

  const { data: seasons = [] } = useQuery({
    queryKey: ["friend-seasons", profileId],
    queryFn: () => base44.entities.Season.filter({ profile_id: profileId }, "-created_date"),
    enabled: !!profileId,
  });

  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ["friend-sessions", profileId],
    queryFn: () => base44.entities.Session.filter({ profile_id: profileId }, "-date", 200),
    enabled: !!profileId,
  });

  const activeSeason = seasons.find(s => s.is_active);

  const currentSeasonSessions = activeSeason
    ? sessions.filter(s => s.season_id === activeSeason.id || (!s.season_id && sessions.filter(x => x.season_id === activeSeason.id).length === 0))
    : sessions;

  const games = currentSeasonSessions.filter(s => s.type === "game" || s.type === "shift_by_shift");
  const totalGoals = games.reduce((sum, g) => sum + (g.goals || 0), 0);
  const totalAssists = games.reduce((sum, g) => sum + (g.assists || 0), 0);
  const totalPoints = totalGoals + totalAssists;

  const filteredSessions = filter === "all" ? sessions : sessions.filter(s => s.type === filter);

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="px-4 py-8 text-center text-slate-400">Profile not found.</div>
    );
  }

  return (
    <div className="px-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 py-4">
        <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-white font-bold text-xl">{profile.name}'s Profile</h1>
      </div>

      {/* Profile Card (read-only) */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 mb-5">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-2xl bg-sky-500/20 flex items-center justify-center overflow-hidden">
            {profile.photo_url ? (
              <img src={profile.photo_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <User className="w-7 h-7 text-sky-400" />
            )}
          </div>
          <div>
            <h2 className="text-white font-bold text-lg">{profile.name}</h2>
            <p className="text-slate-400 text-sm">@{profile.username} · {profile.position}</p>
            {profile.age && <p className="text-slate-500 text-xs">Age {profile.age}</p>}
          </div>
        </div>

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

      {/* Session Filters */}
      <Tabs value={filter} onValueChange={setFilter} className="mb-4">
        <TabsList className="bg-slate-800/60 border border-slate-700/50 w-full">
          <TabsTrigger value="all" className="flex-1 data-[state=active]:bg-slate-700 text-xs">All</TabsTrigger>
          <TabsTrigger value="game" className="flex-1 data-[state=active]:bg-slate-700 text-xs">Games</TabsTrigger>
          <TabsTrigger value="practice" className="flex-1 data-[state=active]:bg-slate-700 text-xs">Practice</TabsTrigger>
          <TabsTrigger value="training" className="flex-1 data-[state=active]:bg-slate-700 text-xs">Training</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Session History (read-only, no click navigation) */}
      <div className="space-y-3">
        {sessionsLoading ? (
          [1, 2, 3].map(i => <div key={i} className="bg-slate-800/40 rounded-2xl h-24 animate-pulse" />)
        ) : filteredSessions.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">No sessions logged yet</div>
        ) : (
          filteredSessions.map(session => (
            <SessionCard key={session.id} session={session} />
          ))
        )}
      </div>
    </div>
  );
}