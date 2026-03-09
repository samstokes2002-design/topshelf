import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Trophy, Target, TrendingUp, Flame, Zap, Shield, ArrowUpCircle, ArrowDownCircle, Star, Clock } from "lucide-react";
import ProfileSwitcher from "@/components/ProfileSwitcher";
import { createPageUrl } from "@/utils";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns";

const COLORS = ["#0ea5e9", "#10b981", "#8b5cf6", "#f59e0b"];

const TABS = [
  { id: "season", label: "Season" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
  { id: "career", label: "Career" },
];

export default function Stats() {
  const [activeProfile, setActiveProfile] = useState(null);
  const [activeTab, setActiveTab] = useState("season");

  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return base44.entities.Profile.filter({ created_by: currentUser.email }, "-created_date");
    },
  });

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["sessions-stats", activeProfile?.id],
    queryFn: () =>
      activeProfile
        ? base44.entities.Session.filter({ profile_id: activeProfile.id }, "-date", 200)
        : [],
    enabled: !!activeProfile,
  });

  const { data: activeSeason } = useQuery({
    queryKey: ["activeSeason-stats", activeProfile?.id],
    queryFn: async () => {
      const seasons = await base44.entities.Season.filter({ profile_id: activeProfile.id, is_active: true });
      return seasons[0] || null;
    },
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
  };

  // Filter sessions based on active tab
  const now = new Date();
  const filteredSessions = sessions.filter((s) => {
    if (!s.date) return activeTab === "career";
    // Parse as local midnight to avoid UTC offset issues
    const [y, m, day] = s.date.split("-").map(Number);
    const d = new Date(y, m - 1, day);
    if (activeTab === "season") return activeSeason ? s.season_id === activeSeason.id : false;
    if (activeTab === "weekly") {
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
      return d >= weekStart && d <= weekEnd;
    }
    if (activeTab === "monthly") return d >= startOfMonth(now) && d <= endOfMonth(now);
    return true; // career
  });

  // Games = both "game" and "shift_by_shift" types count toward game stats
  const games = filteredSessions.filter((s) => s.type === "game" || s.type === "shift_by_shift");
  const totalGoals = games.reduce((s, g) => s + (g.goals || 0), 0);
  const totalAssists = games.reduce((s, g) => s + (g.assists || 0), 0);
  const totalShots = games.reduce((s, g) => s + (g.shots || 0), 0);
  const totalHits = games.reduce((s, g) => s + (g.hits || 0), 0);
  const totalBlocks = games.reduce((s, g) => s + (g.blocked_shots || 0), 0);
  const totalTakeaways = games.reduce((s, g) => s + (g.takeaways || 0), 0);
  const totalGiveaways = games.reduce((s, g) => s + (g.giveaways || 0), 0);
  const totalPlusMinus = games.reduce((s, g) => s + (g.plus_minus || 0), 0);
  const wins = games.filter((g) => g.result === "win").length;
  const losses = games.filter((g) => g.result === "loss").length;
  const ties = games.filter((g) => g.result === "tie").length;
  const ratedSessions = filteredSessions.filter((s) => s.rating);
  const avgRating = ratedSessions.length > 0
    ? (ratedSessions.reduce((s, g) => s + (g.rating || 0), 0) / ratedSessions.length).toFixed(1)
    : "0";
  const totalPoints = totalGoals + totalAssists;
  const totalPenaltyMinutes = games.reduce((s, g) => s + (g.penalty_minutes || 0), 0);
  const shootingPct = totalShots > 0 ? ((totalGoals / totalShots) * 100).toFixed(1) : "0";
  const ppg = games.length > 0 ? (totalPoints / games.length).toFixed(2) : "0";
  const totalPPG = games.reduce((s, g) => s + (g.power_play_goals || 0), 0);
  const totalPPP = games.reduce((s, g) => s + (g.power_play_points || 0), 0);
  const totalSHG = games.reduce((s, g) => s + (g.shorthanded_goals || 0), 0);
  const totalSHP = games.reduce((s, g) => s + (g.shorthanded_points || 0), 0);
  
  const totalFaceoffWins = games.reduce((s, g) => s + (g.faceoff_wins || 0), 0);
  const totalFaceoffLosses = games.reduce((s, g) => s + (g.faceoff_losses || 0), 0);
  const faceoffPct = (totalFaceoffWins + totalFaceoffLosses) > 0 
    ? ((totalFaceoffWins / (totalFaceoffWins + totalFaceoffLosses)) * 100).toFixed(1) 
    : "0";

  // AVG TOI — calculated only from shift_by_shift sessions using exact seconds from shifts array
  const shiftSessions = filteredSessions.filter(s => s.type === "shift_by_shift" && s.shifts && s.shifts.length > 0);
  const totalToiSeconds = shiftSessions.reduce((sum, s) => 
    sum + s.shifts.reduce((ss, shift) => ss + (shift.duration_seconds || 0), 0), 0);
  const avgToiSeconds = shiftSessions.length > 0 ? Math.round(totalToiSeconds / shiftSessions.length) : 0;
  const avgToiDisplay = shiftSessions.length > 0
    ? `${Math.floor(avgToiSeconds / 60)}:${String(avgToiSeconds % 60).padStart(2, "0")}`
    : "—";

  // Use season's selected_stats for period breakdown columns
  const defaultStats = ["goals", "assists", "shots", "plus_minus", "hits", "blocked_shots", "takeaways", "giveaways", "penalty_minutes"];
  const allShiftStatKeys = (activeSeason?.selected_stats?.length > 0 ? activeSeason.selected_stats : defaultStats)
    .filter(k => k !== "rating" && k !== "faceoff_percentage" && k !== "time_on_ice");

  // Period breakdown from shift_by_shift sessions
  // Shifts without a period field default to period 1
  const periodStats = [1, 2, 3].map((period) => {
    const periodShifts = shiftSessions.flatMap(s => 
      (s.shifts || []).filter(sh => (sh.period ?? 1) === period)
    );
    const toiSeconds = periodShifts.reduce((sum, sh) => sum + (sh.duration_seconds || 0), 0);
    const toiMin = Math.floor(toiSeconds / 60);
    const toiSec = toiSeconds % 60;
    const stats = {};
    allShiftStatKeys.forEach(key => {
      stats[key] = periodShifts.reduce((sum, sh) => sum + (sh.stats?.[key] || 0), 0);
    });
    return {
      label: period === 1 ? "1st" : period === 2 ? "2nd" : "3rd",
      period,
      shifts: periodShifts.length,
      toi: toiSeconds > 0 ? `${toiMin}:${String(toiSec).padStart(2, "0")}` : "—",
      stats,
    };
  });
  const hasPeriodData = shiftSessions.length > 0;

  const PERIOD_STAT_LABELS = {
    goals: "G", assists: "A", shots: "SOG", plus_minus: "+/-",
    hits: "Hits", blocked_shots: "BLK", takeaways: "TK", giveaways: "GV",
    penalty_minutes: "PIM", faceoff_wins: "FOW", faceoff_losses: "FOL",
    power_play_goals: "PPG", power_play_points: "PPP",
    shorthanded_goals: "SHG", shorthanded_points: "SHP",
  };

  const typeBreakdown = [
    { name: "Games", value: games.length },
    { name: "Practice", value: filteredSessions.filter((s) => s.type === "practice").length },
    { name: "Training", value: filteredSessions.filter((s) => s.type === "training").length },
  ].filter((t) => t.value > 0);

  const recordData = [
    { name: "W", value: wins, color: "#10b981" },
    { name: "L", value: losses, color: "#ef4444" },
    { name: "T", value: ties, color: "#f59e0b" },
  ];

  return (
    <div className="px-4 pb-24">
      <div className="flex items-center justify-between py-4">
        <h1 className="text-white font-bold text-xl">Stats</h1>
        <ProfileSwitcher
          profiles={profiles}
          activeProfile={activeProfile}
          onSwitch={handleProfileSwitch}
          onAdd={() => window.location.href = createPageUrl("CreateProfile")}
        />
      </div>

      {/* Tab Selector */}
      <div className="flex bg-slate-800/60 border border-slate-700/50 rounded-2xl p-1 mb-5">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
              activeTab === tab.id
                ? "bg-sky-500 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-slate-800/40 rounded-2xl h-20 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Record */}
          {games.length > 0 && (
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {recordData.map((r) => (
                    <div key={r.name} className="text-center">
                      <span className="text-2xl font-bold" style={{ color: r.color }}>{r.value}</span>
                      <span className="text-[10px] text-slate-400 block uppercase">{r.name}</span>
                    </div>
                  ))}
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  </div>
                  <span className="text-2xl font-bold text-white">{avgRating}</span>
                  <span className="text-[10px] text-slate-400 block">Avg Rating</span>
                </div>
              </div>
            </div>
          )}

          {/* Scoring */}
          <SectionCard title="Scoring" icon={Trophy} iconColor="text-sky-400">
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Games Played" value={games.length} icon={Trophy} color="text-slate-400" />
              <StatCard label="Goals" value={totalGoals} icon={Trophy} color="text-sky-400" />
              <StatCard label="Assists" value={totalAssists} icon={Target} color="text-emerald-400" />
              <StatCard label="Points" value={totalPoints} icon={TrendingUp} color="text-violet-400" />
              <StatCard
                label="+/-"
                value={totalPlusMinus > 0 ? `+${totalPlusMinus}` : totalPlusMinus}
                icon={totalPlusMinus >= 0 ? ArrowUpCircle : ArrowDownCircle}
                color={totalPlusMinus >= 0 ? "text-emerald-400" : "text-red-400"}
              />
              <StatCard label="Shots" value={totalShots} icon={Target} color="text-white" />
              <StatCard label="Points/Game" value={ppg} icon={TrendingUp} color="text-violet-400" />
            </div>
          </SectionCard>

          {/* Defensive */}
          <SectionCard title="Defensive" icon={Shield} iconColor="text-blue-400">
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Blocks" value={totalBlocks} icon={Shield} color="text-blue-400" />
              <StatCard label="Hits" value={totalHits} icon={Zap} color="text-white" />
              <StatCard label="Takeaways" value={totalTakeaways} icon={ArrowUpCircle} color="text-emerald-400" />
            </div>
          </SectionCard>

          {/* Discipline */}
          <SectionCard title="Discipline" icon={Flame} iconColor="text-orange-400">
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Penalty Min" value={totalPenaltyMinutes} icon={Flame} color="text-orange-400" />
              <StatCard label="Giveaways" value={totalGiveaways} icon={ArrowDownCircle} color="text-red-400" />
            </div>
          </SectionCard>

          {/* Advanced Stats */}
          <SectionCard title="Advanced Stats" icon={TrendingUp} iconColor="text-violet-400">
            <div className="grid grid-cols-2 gap-3">
              {(totalFaceoffWins + totalFaceoffLosses) > 0 && (
                <StatCard label="FO%" value={`${faceoffPct}%`} icon={Target} color="text-sky-400" />
              )}
              <StatCard label="Shoot %" value={`${shootingPct}%`} icon={Flame} color="text-orange-400" />
              <StatCard label="PPG" value={totalPPG} icon={TrendingUp} color="text-violet-400" />
              <StatCard label="PPP" value={totalPPP} icon={TrendingUp} color="text-violet-400" />
              <StatCard label="SHG" value={totalSHG} icon={TrendingUp} color="text-emerald-400" />
              <StatCard label="SHP" value={totalSHP} icon={TrendingUp} color="text-emerald-400" />
              <StatCard label="Avg TOI" value={avgToiDisplay} icon={Clock} color="text-amber-400" />
            </div>
          </SectionCard>



          {/* Period Breakdown */}
          {hasPeriodData && (
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 mb-4">
              <h3 className="text-white font-semibold text-sm mb-3">Period Breakdown</h3>
              <div className="grid grid-cols-3 gap-2">
                {periodStats.map((p) => (
                  <div key={p.period} className={`rounded-xl p-3 border ${p.shifts > 0 ? "bg-slate-700/60 border-slate-600/50" : "bg-slate-800/30 border-slate-700/30 opacity-40"}`}>
                    <div className="text-center mb-2">
                      <span className="text-sky-400 font-bold text-sm">{p.label}</span>
                    </div>
                    <div className="space-y-1 text-xs">
                      {(() => {
                        const ordered = [
                          "goals", "assists",
                          "plus_minus", "shots",
                          ...allShiftStatKeys.filter(k => !["goals","assists","plus_minus","shots"].includes(k))
                        ].filter(k => allShiftStatKeys.includes(k));
                        return ordered.map(key => (
                          <React.Fragment key={key}>
                            <div className="flex justify-between">
                              <span className="text-slate-400">{PERIOD_STAT_LABELS[key] || key}</span>
                              <span className={`font-medium ${key === "plus_minus" ? (p.stats[key] > 0 ? "text-emerald-400" : p.stats[key] < 0 ? "text-red-400" : "text-white") : key === "giveaways" ? "text-red-400" : key === "takeaways" ? "text-emerald-400" : "text-white"}`}>
                                {key === "plus_minus" && p.stats[key] > 0 ? `+${p.stats[key]}` : p.stats[key]}
                              </span>
                            </div>
                            {key === "assists" && (
                              <div className="flex justify-between">
                                <span className="text-slate-400">PTS</span>
                                <span className="text-sky-400 font-bold">{(p.stats.goals || 0) + (p.stats.assists || 0)}</span>
                              </div>
                            )}
                          </React.Fragment>
                        ));
                      })()}
                       <div className="flex justify-between pt-1 border-t border-slate-600/50">
                         <span className="text-slate-500">Shifts</span>
                         <span className="text-slate-300 font-medium">{p.shifts}</span>
                       </div>
                     </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Type Breakdown */}
          {typeBreakdown.length > 0 && (
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 mb-4">
              <h3 className="text-white font-semibold text-sm mb-3">Session Breakdown</h3>
              <div className="flex items-center">
                <ResponsiveContainer width={120} height={120}>
                  <PieChart>
                    <Pie data={typeBreakdown} cx="50%" cy="50%" innerRadius={30} outerRadius={50} dataKey="value" stroke="none">
                      {typeBreakdown.map((_, i) => (
                        <Cell key={i} fill={COLORS[i]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 ml-4">
                  {typeBreakdown.map((t, i) => (
                    <div key={t.name} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i] }} />
                      <span className="text-xs text-slate-300">{t.name}</span>
                      <span className="text-xs text-white font-semibold ml-auto">{t.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="text-center text-xs text-slate-500 mt-4">
            {filteredSessions.length} sessions in view
          </div>
        </>
      )}
    </div>
  );
}

function SectionCard({ title, icon: Icon, iconColor, children }) {
  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        <h3 className="text-white font-semibold text-sm">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className={`w-3 h-3 ${color}`} />
        <span className="text-[10px] text-slate-400 uppercase tracking-wider">{label}</span>
      </div>
      <span className="text-xl font-bold text-white">{value}</span>
    </div>
  );
}