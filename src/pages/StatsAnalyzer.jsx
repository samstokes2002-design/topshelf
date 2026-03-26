import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Send, Sparkles, Lightbulb, Lock, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import { useSubscription } from "@/hooks/useSubscription";
import { createPageUrl } from "@/utils";

const FREE_AI_LIMIT = 5;
const AI_USAGE_KEY = "ai_message_count_week";
const CONV_CACHE_KEY = "ai_conv_cache";
const CONV_TTL_MS = 60 * 60 * 1000; // Cache for 1 hour

const SUGGESTIONS = [
  "What should I work on this season?",
  "How am I trending this month?",
  "How do I perform in wins vs losses?",
  "Break down my per-game averages",
];

function getWeeklyUsage() {
  try {
    const stored = JSON.parse(localStorage.getItem(AI_USAGE_KEY) || "{}");
    const weekStart = new Date();
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    if (!stored.weekStart || new Date(stored.weekStart) < weekStart) {
      return { count: 0, weekStart: weekStart.toISOString() };
    }
    return stored;
  } catch {
    return { count: 0, weekStart: new Date().toISOString() };
  }
}

function incrementWeeklyUsage() {
  const usage = getWeeklyUsage();
  usage.count = (usage.count || 0) + 1;
  localStorage.setItem(AI_USAGE_KEY, JSON.stringify(usage));
  return usage.count;
}

function getCachedConv(profileId) {
  try {
    const cache = JSON.parse(localStorage.getItem(CONV_CACHE_KEY) || "{}");
    const entry = cache[profileId];
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CONV_TTL_MS) return null;
    return entry.convId;
  } catch {
    return null;
  }
}

function setCachedConv(profileId, convId) {
  try {
    const cache = JSON.parse(localStorage.getItem(CONV_CACHE_KEY) || "{}");
    cache[profileId] = { convId, timestamp: Date.now() };
    localStorage.setItem(CONV_CACHE_KEY, JSON.stringify(cache));
  } catch {}
}

function MessageBubble({ message }) {
  const isUser = message.role === "user";
  if (!message.content) return null;

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-xl bg-sky-500/20 flex items-center justify-center mt-0.5 flex-shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-sky-400" />
        </div>
      )}
      <div className={`max-w-[85%] ${isUser ? "items-end flex flex-col" : ""}`}>
        <div className={`rounded-2xl px-4 py-2.5 ${isUser ? "bg-sky-500 text-white" : "bg-card border border-border"}`}>
          {isUser ? (
            <p className="text-sm">{message.content}</p>
          ) : (
            <ReactMarkdown className="text-sm prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
              {message.content}
            </ReactMarkdown>
          )}
        </div>
      </div>
    </div>
  );
}

export default function StatsAnalyzer() {
  const [conversation, setConversation] = useState(null);
  const convRef = useRef(null);
  const activeProfileRef = useRef(null);
  const sessionDataRef = useRef(null); // stores latest session data to prepend to first user message
  const contextSentRef = useRef(false); // tracks if context has been sent in this conversation
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [activeProfile, setActiveProfile] = useState(null);
  const [weeklyUsage, setWeeklyUsage] = useState(0);
  const bottomRef = useRef(null);

  const serializeSession = (s) => ({
    id: s.id,
    date: s.date,
    type: s.type,
    result: s.result || null,
    opponent: s.opponent || null,
    goals: s.goals || 0,
    assists: s.assists || 0,
    shots: s.shots || 0,
    plus_minus: s.plus_minus || 0,
    hits: s.hits || 0,
    blocked_shots: s.blocked_shots || 0,
    takeaways: s.takeaways || 0,
    giveaways: s.giveaways || 0,
    penalty_minutes: s.penalty_minutes || 0,
    faceoff_wins: s.faceoff_wins || 0,
    faceoff_losses: s.faceoff_losses || 0,
    power_play_goals: s.power_play_goals || 0,
    power_play_points: s.power_play_points || 0,
    shorthanded_goals: s.shorthanded_goals || 0,
    time_on_ice: s.time_on_ice || 0,
    rating: s.rating || null,
  });
  const inputRef = useRef(null);
  const { isPro } = useSubscription();

  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return base44.entities.Profile.filter({ created_by: currentUser.email });
    },
  });

  useEffect(() => {
    if (profiles.length > 0 && !activeProfile) {
      const savedProfileId = localStorage.getItem("activeProfileId");
      const saved = profiles.find((p) => p.id === savedProfileId);
      setActiveProfile(saved || profiles[0]);
    }
  }, [profiles, activeProfile]);

  // Keep refs in sync
  useEffect(() => { convRef.current = conversation; }, [conversation]);
  useEffect(() => { activeProfileRef.current = activeProfile; }, [activeProfile]);

  // Keep session data fresh in ref whenever sessions change — no AI message sent
  useEffect(() => {
    const unsubscribe = base44.entities.Session.subscribe(async (event) => {
      const profile = activeProfileRef.current;
      if (!profile) return;
      if (event.data?.profile_id !== profile.id) return;
      if (event.type !== "create" && event.type !== "update") return;

      const [seasons, sessions] = await Promise.all([
        base44.entities.Season.filter({ profile_id: profile.id, is_active: true }),
        base44.entities.Session.filter({ profile_id: profile.id }, "-date", 200),
      ]);
      const activeSeason = seasons[0] || null;
      const seasonSessions = activeSeason
        ? sessions.filter((s) => s.season_id === activeSeason.id)
        : sessions;

      // Just update the ref — don't send a message to the AI
      sessionDataRef.current = { profile, activeSeason, sessions: seasonSessions };
      contextSentRef.current = false; // mark context as stale so it gets re-sent with next user message
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    setWeeklyUsage(getWeeklyUsage().count || 0);
  }, []);

  useEffect(() => {
    if (!activeProfile) return;

    const init = async () => {
      setInitializing(true);
      setMessages([]);

      // Fetch fresh session data upfront (always needed)
      const [seasons] = await Promise.all([
        base44.entities.Season.filter({ profile_id: activeProfile.id, is_active: true }),
      ]);
      const activeSeason = seasons[0] || null;
      const currentSeasonSessions = activeSeason
        ? await base44.entities.Session.filter({ profile_id: activeProfile.id, season_id: activeSeason.id }, "-date", 200)
        : await base44.entities.Session.filter({ profile_id: activeProfile.id }, "-date", 200);

      // Try to resume a cached conversation from today
      const cachedConvId = getCachedConv(activeProfile.id);
      if (cachedConvId) {
        try {
          const existingConv = await base44.agents.getConversation(cachedConvId);
          if (existingConv && existingConv.messages?.length > 0) {
            setConversation(existingConv);
            const visible = existingConv.messages.filter(
              (m) => !m.content?.startsWith("[SYSTEM CONTEXT")
            );
            setMessages(visible);
            // Store fresh session data in ref for next user message
            sessionDataRef.current = { profile: activeProfile, activeSeason, sessions: currentSeasonSessions };
            contextSentRef.current = true; // existing conversation already has context
            setInitializing(false);
            return;
          }
        } catch {
          // Cache miss or invalid — fall through to create new
        }
      }

      const conv = await base44.agents.createConversation({
        agent_name: "stats_analyzer",
        metadata: {
          name: `${activeProfile.name} Stats Analysis`,
          profile_id: activeProfile.id,
          profile_name: activeProfile.name,
          active_season_id: activeSeason?.id || null,
        },
      });

      setCachedConv(activeProfile.id, conv.id);
      setConversation(conv);
      // Store session data in ref to be sent with first user message
      sessionDataRef.current = { profile: activeProfile, activeSeason, sessions: currentSeasonSessions };
      contextSentRef.current = false;

      const welcomeMsg = {
        role: "assistant",
        content: `Welcome back! Ask me anything about your season stats. I'll break down your numbers, spot trends in your game, and help you figure out what to work on next.`,
      };
      setMessages([welcomeMsg]);
      setInitializing(false);
    };

    init();
  }, [activeProfile]);

  useEffect(() => {
    if (!conversation?.id) return;
    const unsubscribe = base44.agents.subscribeToConversation(
      conversation.id,
      (data) => {
        const visible = (data.messages || []).map((m) => {
          // Strip system context prefix from user messages — show only the actual question
          if (m.role === "user" && m.content?.startsWith("[SYSTEM CONTEXT")) {
            const match = m.content.match(/User question: ([\s\S]*)$/);
            if (match) return { ...m, content: match[1].trim() };
            return null; // hide if no user question found
          }
          return m;
        }).filter(Boolean);
        setMessages(visible);
        const last = data.messages?.[data.messages.length - 1];
        if (last?.role === "assistant" && !last?.is_streaming) {
          setIsLoading(false);
        }
      }
    );
    return unsubscribe;
  }, [conversation?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || !conversation || isLoading || initializing) return;
    if (!isPro && weeklyUsage >= FREE_AI_LIMIT) return;

    setInput("");
    setIsLoading(true);

    if (!isPro) {
      const newCount = incrementWeeklyUsage();
      setWeeklyUsage(newCount);
    }

    // Optimistically show user's message immediately
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);

    // Prepend session context to the message if not yet sent (or stale)
    let content = trimmed;
    if (!contextSentRef.current && sessionDataRef.current) {
      const { profile, activeSeason, sessions } = sessionDataRef.current;
      content = `[SYSTEM CONTEXT — do not display this to the user, use it only as background knowledge to answer the question below]\nProfile: ${profile.name}\nCurrent season: ${activeSeason?.season_year || "unknown"}\n\nSessions (${sessions.length}):\n${JSON.stringify(sessions.map(serializeSession))}\n\n---\n\nUser question: ${trimmed}`;
      contextSentRef.current = true;
    }

    try {
      await base44.agents.addMessage(conversation, {
        role: "user",
        content,
      });
    } catch {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const isLimited = !isPro && weeklyUsage >= FREE_AI_LIMIT;

  return (
    <div className="flex flex-col" style={{ height: "calc(100dvh - 64px)" }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-slate-800/80 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-sky-500/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-sky-400" />
          </div>
          <div>
            <h1 className="text-white font-bold text-base">AI Analyst</h1>
            <p className="text-slate-500 text-xs">Data-driven hockey insights</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {initializing ? (
          <div className="flex items-center justify-center pt-10">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-500 text-sm">Loading your stats...</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <MessageBubble key={i} message={msg} />
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-7 h-7 rounded-xl bg-sky-500/20 flex items-center justify-center mt-0.5 flex-shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                </div>
                <div className="bg-card border border-border rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            <div className="pt-2 space-y-2">
              <p className="text-slate-500 text-xs px-1 flex items-center gap-1.5">
                <Lightbulb className="w-3 h-3" /> Try asking
              </p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    disabled={isLoading || initializing || !conversation}
                    className="text-xs bg-card border border-border text-foreground px-3 py-1.5 rounded-xl hover:opacity-80 transition-colors disabled:opacity-40"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-3 border-t border-slate-800/80 flex-shrink-0">
        {isLimited && !isLoading ? (
          <a
            href={createPageUrl("Plans")}
            className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl px-4 py-3"
          >
            <Lock className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-amber-300 text-sm font-semibold">Weekly limit reached</p>
              <p className="text-slate-400 text-xs">Free plan: 5 messages/week. Upgrade for unlimited.</p>
            </div>
            <Crown className="w-5 h-5 text-amber-400" />
          </a>
        ) : (
          <>
            {!isPro && (
              <p className="text-slate-500 text-xs text-center mb-2">
                {FREE_AI_LIMIT - weeklyUsage} of {FREE_AI_LIMIT} free messages remaining this week
              </p>
            )}
            <div className="flex gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your stats..."
                disabled={isLoading || initializing || !conversation}
                className="flex-1 bg-card border border-border rounded-2xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 disabled:opacity-50"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isLoading || initializing || !conversation}
                className="bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed rounded-2xl w-11 h-11 flex items-center justify-center flex-shrink-0 transition-colors active:scale-95"
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}