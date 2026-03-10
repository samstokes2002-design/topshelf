import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, User, MoreVertical, Flag, Shield, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SessionCard from "@/components/SessionCard";
import SeasonStats from "@/components/SeasonStats";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function FriendProfile() {
  const urlParams = new URLSearchParams(window.location.search);
  const profileId = urlParams.get("id");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [selectedSeasonId, setSelectedSeasonId] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [actionDone, setActionDone] = useState(null); // 'reported' | 'blocked'

  const blockMutation = useMutation({
    mutationFn: () => base44.functions.invoke('blockUser', { profileId }),
    onSuccess: () => {
      setShowBlockModal(false);
      setActionDone('blocked');
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
    },
  });

  const reportMutation = useMutation({
    mutationFn: () => base44.functions.invoke('reportUser', { profileId, reason: reportReason }),
    onSuccess: () => {
      setShowReportModal(false);
      setReportReason("");
      setActionDone('reported');
    },
  });

  const { data: myProfileId } = useQuery({
    queryKey: ["myProfileId"],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      const savedId = localStorage.getItem("activeProfileId");
      const profiles = await base44.entities.Profile.filter({ created_by: currentUser.email });
      if (savedId && profiles.find(p => p.id === savedId)) return savedId;
      return profiles[0]?.id || null;
    },
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ["friend-profile", profileId, myProfileId],
    queryFn: async () => {
      const res = await base44.functions.invoke('getFriendProfile', { profileId, myProfileId });
      return res.data;
    },
    enabled: !!profileId && !!myProfileId,
  });

  const profile = data?.profile;
  const seasons = data?.seasons || [];
  const sessions = data?.sessions || [];

  const activeSeason = seasons.find(s => s.is_active);
  const currentSeasonSessions = activeSeason
    ? sessions.filter(s => s.season_id === activeSeason.id)
    : sessions;

  const games = currentSeasonSessions.filter(s => s.type === "game" || s.type === "shift_by_shift");
  const totalGoals = games.reduce((sum, g) => sum + (g.goals || 0), 0);
  const totalAssists = games.reduce((sum, g) => sum + (g.assists || 0), 0);
  const totalPoints = totalGoals + totalAssists;

  const getSessionsForSeason = (season) => {
    const byId = sessions.filter(s => s.season_id === season.id);
    if (byId.length > 0) return byId;
    return sessions.filter(s => !s.season_id);
  };

  const filteredSessions = filter === "all" ? sessions : sessions.filter(s => s.type === filter);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="px-4 py-8 text-center text-slate-400">
        <p className="mb-4">Could not load profile.</p>
        <button onClick={() => navigate(-1)} className="text-sky-400 text-sm">Go back</button>
      </div>
    );
  }

  if (actionDone === 'blocked') {
    return (
      <div className="px-4 py-8 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-slate-400" />
        </div>
        <h2 className="text-white font-bold text-lg mb-2">User Blocked</h2>
        <p className="text-slate-400 text-sm mb-6">This user has been blocked and you've been unfriended.</p>
        <button onClick={() => navigate(-1)} className="text-sky-400 text-sm">Go back</button>
      </div>
    );
  }

  return (
    <div className="px-4 pb-24">
      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold text-lg">Report User</h3>
              <button onClick={() => setShowReportModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-slate-400 text-sm mb-4">Tell us why you're reporting <span className="text-white font-medium">{profile.name}</span>.</p>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Describe the issue..."
              className="w-full bg-slate-900/50 border border-slate-700/50 text-white rounded-xl p-3 text-sm resize-none h-24 outline-none focus:border-sky-500"
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowReportModal(false)} className="flex-1 py-2.5 rounded-xl bg-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-600 transition-colors">
                Cancel
              </button>
              <button
                onClick={() => reportMutation.mutate()}
                disabled={reportMutation.isPending}
                className="flex-1 py-2.5 rounded-xl bg-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/30 transition-colors disabled:opacity-50"
              >
                {reportMutation.isPending ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Block Confirmation Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500/20 mx-auto mb-4">
              <Shield className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="text-white font-bold text-center text-lg mb-1">Block {profile.name}?</h3>
            <p className="text-slate-400 text-sm text-center mb-6">
              They won't be able to view your profile or send you friend requests. You'll also be unfriended.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowBlockModal(false)} className="flex-1 py-2.5 rounded-xl bg-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-600 transition-colors">
                Cancel
              </button>
              <button
                onClick={() => blockMutation.mutate()}
                disabled={blockMutation.isPending}
                className="flex-1 py-2.5 rounded-xl bg-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/30 transition-colors disabled:opacity-50"
              >
                {blockMutation.isPending ? "Blocking..." : "Block User"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-white font-bold text-xl">{profile.name}'s Profile</h1>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowMenu(prev => !prev)}
            className="text-slate-400 hover:text-white transition-colors p-1"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-8 z-40 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden w-44">
                <button
                  onClick={() => { setShowMenu(false); setShowReportModal(true); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-200 hover:bg-slate-700 transition-colors"
                >
                  <Flag className="w-4 h-4 text-amber-400" />
                  Report User
                </button>
                <button
                  onClick={() => { setShowMenu(false); setShowBlockModal(true); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-slate-700 transition-colors"
                >
                  <Shield className="w-4 h-4" />
                  Block User
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {actionDone === 'reported' && (
        <div className="bg-emerald-500/20 text-emerald-400 text-sm rounded-xl px-4 py-2 mb-4 text-center">
          Report submitted. Thank you.
        </div>
      )}

      {/* Profile Card */}
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
            <p className="text-xs text-slate-400 mb-2">Current Season · {activeSeason.season_year}</p>
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

      {/* Seasons */}
      {seasons.length > 0 && (
        <div className="mb-5">
          <h3 className="text-white font-semibold text-sm mb-3">Seasons</h3>
          <div className="space-y-2">
            {seasons.map((season) => {
              const seasonSessions = getSessionsForSeason(season);
              const seasonGames = seasonSessions.filter(s => s.type === "game" || s.type === "shift_by_shift");
              const seasonPractices = seasonSessions.filter(s => s.type === "practice");
              const seasonTraining = seasonSessions.filter(s => s.type === "training");

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
        {filteredSessions.length === 0 ? (
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