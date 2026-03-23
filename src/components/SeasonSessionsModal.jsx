import React, { useState } from "react";
import { X, Trophy, Target, Dumbbell, Timer, ChevronRight } from "lucide-react";
import SessionCard from "@/components/SessionCard";
import { createPageUrl } from "@/utils";

const TABS = [
  { id: "all", label: "All" },
  { id: "game", label: "Games", icon: Trophy },
  { id: "shift_by_shift", label: "Shifts", icon: Timer },
  { id: "practice", label: "Practice", icon: Target },
  { id: "training", label: "Training", icon: Dumbbell },
];

export default function SeasonSessionsModal({ sessions, seasonYear, onClose }) {
  const [activeTab, setActiveTab] = useState("all");

  const filtered = activeTab === "all"
    ? sessions
    : sessions.filter(s => s.type === activeTab);

  const sorted = [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex flex-col">
      <div className="flex-1 overflow-hidden flex flex-col max-w-lg mx-auto w-full mt-12 bg-slate-900 rounded-t-3xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-5 pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-white font-bold text-lg">Sessions</h2>
            <p className="text-slate-400 text-xs">{seasonYear}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 py-3 overflow-x-auto scrollbar-hide">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-sky-500 text-white"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Count */}
        <div className="px-4 pb-2">
          <p className="text-slate-500 text-xs">{sorted.length} session{sorted.length !== 1 ? "s" : ""}</p>
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-3">
          {sorted.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">No sessions in this category</div>
          ) : (
            sorted.map(session => (
              <SessionCard
                key={session.id}
                session={session}
                onClick={() => {
                  onClose();
                  window.location.href = createPageUrl("SessionDetail") + `?id=${session.id}`;
                }}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}