import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User, Settings, UserCog, ChevronRight, Trophy, Target, Dumbbell, Calendar } from "lucide-react";
import { format } from "date-fns";
import SessionCard from "@/components/SessionCard";
import ProfileSwitcher from "@/components/ProfileSwitcher";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Profile() {
  const [activeProfile, setActiveProfile] = useState(null);
  const [filter, setFilter] = useState("all");

  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return base44.entities.Profile.filter({ created_by: currentUser.email }, "-created_date");
    },
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
    if (profiles.length === 0 && profiles !== undefined) {
      window.location.href = createPageUrl("CreateProfile");
    } else if (profiles.length > 0 && !activeProfile) {
      const savedProfileId = localStorage.getItem("activeProfileId");
      const savedProfile = profiles.find(p => p.id === savedProfileId);
      setActiveProfile(savedProfile || profiles[0]);
    }
  }, [profiles, activeProfile]);

  const handleProfileSwitch = (profile) => {
    setActiveProfile(profile);
    localStorage.setItem("activeProfileId", profile.id);
  };

  const filteredSessions = filter === "all"
    ? sessions
    : sessions.filter((s) => s.type === filter);

  const games = sessions.filter((s) => s.type === "game");
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
            onSwitch={setActiveProfile}
            onAdd={() => window.location.href = createPageUrl("CreateProfile")}
          />
        )}

        {/* Season Totals */}
        <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-700/50">
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