import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from "recharts";
import { Trophy, Target, TrendingUp, Flame, Zap, Shield, ArrowUpCircle, ArrowDownCircle, Star, Clock } from "lucide-react";
import ProfileSwitcher from "@/components/ProfileSwitcher";
import { createPageUrl } from "@/utils";
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from "date-fns";

const COLORS = ["#0ea5e9", "#10b981", "#8b5cf6", "#f59e0b"];

export default function Stats() {
  const [activeProfile, setActiveProfile] = useState(null);

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

  // Games = both "game" and "shift_by_shift" types count toward game stats
  const games = sessions.filter((s) => s.type === "game" || s.type === "shift_by_shift");
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
  const avgRating = sessions.length > 0
    ? (sessions.reduce((s, g) => s + (g.rating || 0), 0) / sessions.filter((s) => s.rating).length).toFixed(1)
    : "—";
  const shootingPct = totalShots > 0 ? ((totalGoals / totalShots) * 100).toFixed(1) : "0";
  const ppg = games.length > 0 ? ((totalGoals + totalAssists) / games.length).toFixed(2) : "0";
  
  const totalFaceoffWins = games.reduce((s, g) => s + (g.faceoff_wins || 0), 0);
  const totalFaceoffLosses = games.reduce((s, g) => s + (g.faceoff_losses || 0), 0);
  const faceoffPct = (totalFaceoffWins + totalFaceoffLosses) > 0 
    ? ((totalFaceoffWins / (totalFaceoffWins + totalFaceoffLosses)) * 100).toFixed(1) 
    : "0";

  // AVG TOI — calculated only from shift_by_shift sessions using exact seconds from shifts array
  const shiftSessions = sessions.filter(s => s.type === "shift_by_shift" && s.shifts && s.shifts.length > 0);
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
    hits: "Hits", blocked_shots: "Blk", takeaways: "TA", giveaways: "GA",
    penalty_minutes: "PIM", faceoff_wins: "FOW", faceoff_losses: "FOL",
    power_play_goals: "PPG", power_play_points: "PPP",
    shorthanded_goals: "SHG", shorthanded_points: "SHP",
  };

  // Monthly chart data
  const last6Months = eachMonthOfInterval({
    start: subMonths(new Date(), 5),
    end: new Date(),
  });

  const monthlyData = last6Months.map((month) => {
    const monthSessions = sessions.filter((s) => {
      if (!s.date) return false;
      const d = new Date(s.date);
      return d >= startOfMonth(month) && d <= endOfMonth(month);
    });
    const monthGames = monthSessions.filter((s) => s.type === "game");
    return {
      month: format(month, "MMM"),
      sessions: monthSessions.length,
      goals: monthGames.reduce((sum, g) => sum + (g.goals || 0), 0),
      assists: monthGames.reduce((sum, g) => sum + (g.assists || 0), 0),
    };
  });

  const typeBreakdown = [
    { name: "Games", value: games.length },
    { name: "Practice", value: sessions.filter((s) => s.type === "practice").length },
    { name: "Training", value: sessions.filter((s) => s.type === "training").length },
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

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-slate-800/40 rounded-2xl h-20 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Key Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <StatCard label="Goals" value={totalGoals} icon={Trophy} color="text-sky-400" />
            <StatCard label="Assists" value={totalAssists} icon={Target} color="text-emerald-400" />
            <StatCard label="Points/Game" value={ppg} icon={TrendingUp} color="text-violet-400" />
            <StatCard label="Shoot %" value={`${shootingPct}%`} icon={Flame} color="text-orange-400" />
            <StatCard 
              label="TOI" 
              value={avgToiDisplay} 
              icon={Clock} 
              color="text-amber-400" 
            />
          </div>

          {/* Advanced Stats */}
          {games.length > 0 && (
            <>
              <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 mb-4">
                <h3 className="text-white font-semibold text-sm mb-3">Game Stats</h3>
                <div className="grid grid-cols-2 gap-3">
                  <StatCard label="Shots" value={totalShots} icon={Target} color="text-white" />
                  <StatCard 
                    label="+/-" 
                    value={totalPlusMinus > 0 ? `+${totalPlusMinus}` : totalPlusMinus} 
                    icon={totalPlusMinus >= 0 ? ArrowUpCircle : ArrowDownCircle} 
                    color={totalPlusMinus >= 0 ? "text-emerald-400" : "text-red-400"} 
                  />
                </div>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 mb-4">
                <h3 className="text-white font-semibold text-sm mb-3">Defense & Possession</h3>
                <div className="grid grid-cols-2 gap-3">
                  <StatCard label="Hits" value={totalHits} icon={Zap} color="text-white" />
                  <StatCard label="Blocks" value={totalBlocks} icon={Shield} color="text-white" />
                  <StatCard label="Takeaways" value={totalTakeaways} icon={ArrowUpCircle} color="text-emerald-400" />
                  <StatCard label="Giveaways" value={totalGiveaways} icon={ArrowDownCircle} color="text-red-400" />
                  {(totalFaceoffWins + totalFaceoffLosses) > 0 && (
                    <StatCard label="FO%" value={`${faceoffPct}%`} icon={Target} color="text-sky-400" />
                  )}
                </div>
              </div>
            </>
          )}

          {/* Record */}
          {games.length > 0 && (
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 mb-4">
              <h3 className="text-white font-semibold text-sm mb-3">Record</h3>
              <div className="flex items-center gap-6">
                {recordData.map((r) => (
                  <div key={r.name} className="text-center">
                    <span className="text-2xl font-bold" style={{ color: r.color }}>{r.value}</span>
                    <span className="text-[10px] text-slate-400 block uppercase">{r.name}</span>
                  </div>
                ))}
                <div className="text-center ml-auto">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  </div>
                  <span className="text-2xl font-bold text-white">{avgRating}</span>
                  <span className="text-[10px] text-slate-400 block">Avg Rating</span>
                </div>
              </div>
            </div>
          )}

          {/* Monthly Chart */}
          {monthlyData.some((m) => m.sessions > 0) && (
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 mb-4">
              <h3 className="text-white font-semibold text-sm mb-3">Monthly Points</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={monthlyData}>
                  <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} width={25} />
                  <Tooltip
                    contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12, fontSize: 12 }}
                    labelStyle={{ color: "#fff" }}
                  />
                  <Bar dataKey="goals" fill="#0ea5e9" radius={[6, 6, 0, 0]} name="Goals" />
                  <Bar dataKey="assists" fill="#10b981" radius={[6, 6, 0, 0]} name="Assists" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

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
                       <div className="flex justify-between">
                         <span className="text-slate-400">TOI</span>
                         <span className="text-white font-medium">{p.toi}</span>
                       </div>
                       {allShiftStatKeys.map(key => (
                         <div key={key} className="flex justify-between">
                           <span className="text-slate-400">{PERIOD_STAT_LABELS[key] || key}</span>
                           <span className={`font-medium ${key === "plus_minus" ? (p.stats[key] > 0 ? "text-emerald-400" : p.stats[key] < 0 ? "text-red-400" : "text-white") : key === "giveaways" ? "text-red-400" : key === "takeaways" ? "text-emerald-400" : "text-white"}`}>
                             {key === "plus_minus" && p.stats[key] > 0 ? `+${p.stats[key]}` : p.stats[key]}
                           </span>
                         </div>
                       ))}
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
            {sessions.length} total sessions logged
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className={`w-3.5 h-3.5 ${color}`} />
        <span className="text-[10px] text-slate-400 uppercase tracking-wider">{label}</span>
      </div>
      <span className="text-2xl font-bold text-white">{value}</span>
    </div>
  );
}