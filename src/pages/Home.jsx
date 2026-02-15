import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus, Activity, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import SessionCard from "@/components/SessionCard";
import EmptyState from "@/components/EmptyState";
import ProfileSwitcher from "@/components/ProfileSwitcher";
import { differenceInCalendarDays, parseISO, parse } from "date-fns";

export default function Home() {
  const [activeProfile, setActiveProfile] = useState(null);

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  const { data: profiles = [], isLoading: profilesLoading } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return base44.entities.Profile.filter({ created_by: currentUser.email }, "-created_date");
    },
  });

  const { data: activeSeason } = useQuery({
    queryKey: ["activeSeason", activeProfile?.id],
    queryFn: async () => {
      if (!activeProfile?.id) return null;
      const seasons = await base44.entities.Season.filter({ 
        profile_id: activeProfile.id,
        is_active: true 
      });
      return seasons[0] || null;
    },
    enabled: !!activeProfile?.id,
  });

  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ["sessions", activeProfile?.id],
    queryFn: () =>
      activeProfile
        ? base44.entities.Session.filter({ profile_id: activeProfile.id }, "-date", 50)
        : base44.entities.Session.list("-date", 50),
    enabled: profiles.length > 0,
  });

  const { data: friends = [] } = useQuery({
    queryKey: ["friends"],
    queryFn: () => base44.entities.Friend.filter({ status: "accepted" }),
  });

  useEffect(() => {
    if (profiles.length > 0 && !activeProfile) {
      setActiveProfile(profiles[0]);
    }
  }, [profiles, activeProfile]);

  // Check if active season exists, redirect to setup if not
  useEffect(() => {
    if (activeProfile && activeSeason === null && !profilesLoading) {
      window.location.href = createPageUrl("SeasonSetup") + `?profileId=${activeProfile.id}`;
    }
  }, [activeProfile, activeSeason, profilesLoading]);

  // Calculate streak
  const getStreak = () => {
    if (sessions.length === 0) return 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get unique dates only (one session per day counts)
    const uniqueDates = [...new Set(
      sessions
        .filter((s) => s.date)
        .map((s) => {
          const d = parse(s.date, "yyyy-MM-dd", new Date());
          d.setHours(0, 0, 0, 0);
          return d.getTime();
        })
    )]
      .sort((a, b) => b - a)
      .map((t) => new Date(t));
    
    if (uniqueDates.length === 0) return 0;
    
    // Check if most recent session is today or yesterday
    const mostRecent = uniqueDates[0];
    const daysSinceRecent = differenceInCalendarDays(today, mostRecent);
    if (daysSinceRecent > 1) return 0;
    
    let streak = 1;
    let checkDate = mostRecent;
    
    for (let i = 1; i < uniqueDates.length; i++) {
      const diff = differenceInCalendarDays(checkDate, uniqueDates[i]);
      if (diff === 1) {
        streak++;
        checkDate = uniqueDates[i];
      } else {
        break;
      }
    }
    return streak;
  };

  const streak = getStreak();
  const totalGames = sessions.filter((s) => s.type === "game").length;
  const totalGoals = sessions.reduce((sum, s) => sum + (s.goals || 0), 0);

  const isLoading = profilesLoading || sessionsLoading;

  if (profilesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center shadow-xl shadow-sky-500/30">
              <Activity className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Welcome to TopShelf</h1>
          <p className="text-slate-400 text-lg mb-8 leading-relaxed">
            Your personal hockey tracker starts here. Create your profile and begin logging your journey on the ice.
          </p>
          <Button 
            size="lg"
            onClick={() => window.location.href = createPageUrl("CreateProfile")}
            className="bg-sky-500 hover:bg-sky-600 text-white rounded-2xl px-8 py-6 text-lg font-semibold shadow-lg shadow-sky-500/30"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Your Profile
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between py-4">
        <ProfileSwitcher
          profiles={profiles}
          activeProfile={activeProfile}
          onSwitch={setActiveProfile}
          onAdd={() => window.location.href = createPageUrl("CreateProfile")}
        />
        <Link to={createPageUrl("LogSession") + `?profileId=${activeProfile?.id || ""}`}>
          <Button size="sm" className="bg-sky-500 hover:bg-sky-600 rounded-xl gap-1.5">
            <Plus className="w-4 h-4" />
            Log
          </Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Streak</span>
          </div>
          <span className="text-2xl font-bold text-white">{streak}</span>
          <span className="text-[10px] text-slate-500 block">days</span>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-3 text-center">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Games</span>
          <span className="text-2xl font-bold text-white">{totalGames}</span>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-3 text-center">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Goals</span>
          <span className="text-2xl font-bold text-sky-400">{totalGoals}</span>
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-semibold">Recent Activity</h2>
          <Link to={createPageUrl("Profile")} className="text-xs text-sky-400 hover:text-sky-300">
            View All
          </Link>
        </div>

        {sessionsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-slate-800/40 rounded-2xl h-24 animate-pulse" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No sessions yet"
            description="Log your first game, practice, or training session."
            actionLabel="Log Session"
            onAction={() => window.location.href = createPageUrl("LogSession") + `?profileId=${activeProfile?.id || ""}`}
          />
        ) : (
          <div className="space-y-3">
            {sessions.slice(0, 10).map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onClick={() => window.location.href = createPageUrl("SessionDetail") + `?id=${session.id}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}