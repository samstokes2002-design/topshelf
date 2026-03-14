import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Send, Sparkles, BarChart2, TrendingUp, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import ReactMarkdown from "react-markdown";

const CHART_COLORS = ["#38bdf8", "#34d399", "#fb923c", "#a78bfa", "#f472b6"];

function ChartBlock({ chartData }) {
  try {
    const parsed = typeof chartData === "string" ? JSON.parse(chartData) : chartData;
    const { type, title, data, keys = [] } = parsed;

    return (
      <div className="bg-slate-800/80 border border-slate-700/50 rounded-2xl p-4 mt-3">
        {title && <p className="text-slate-300 text-xs font-semibold mb-3">{title}</p>}
        <ResponsiveContainer width="100%" height={200}>
          {type === "line" ? (
            <LineChart data={data}>
              <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} />
              <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "none", borderRadius: 8 }} />
              {keys.map((k, i) => (
                <Line key={k} type="monotone" dataKey={k} stroke={CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          ) : type === "pie" ? (
            <PieChart>
              <Pie data={data} dataKey={keys[0] || "value"} nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "none", borderRadius: 8 }} />
            </PieChart>
          ) : (
            <BarChart data={data}>
              <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} />
              <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "none", borderRadius: 8 }} />
              {keys.map((k, i) => (
                <Bar key={k} dataKey={k} fill={CHART_COLORS[i % CHART_COLORS.length]} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    );
  } catch {
    return null;
  }
}

function MessageBubble({ message }) {
  const isUser = message.role === "user";

  const renderContent = (content) => {
    const chartRegex = /```chart_data\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = chartRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: "text", value: content.slice(lastIndex, match.index) });
      }
      parts.push({ type: "chart", value: match[1] });
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < content.length) {
      parts.push({ type: "text", value: content.slice(lastIndex) });
    }

    return parts.map((part, i) =>
      part.type === "chart"
        ? <ChartBlock key={i} chartData={part.value} />
        : <ReactMarkdown key={i} className="text-sm prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">{part.value}</ReactMarkdown>
    );
  };

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-xl bg-sky-500/20 flex items-center justify-center mt-0.5 flex-shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-sky-400" />
        </div>
      )}
      <div className={`max-w-[85%] ${isUser ? "items-end flex flex-col" : ""}`}>
        {message.content && (
          <div className={`rounded-2xl px-4 py-2.5 ${isUser ? "bg-sky-500 text-white" : "bg-slate-800/80 border border-slate-700/50"}`}>
            {isUser
              ? <p className="text-sm">{message.content}</p>
              : renderContent(message.content)
            }
          </div>
        )}
      </div>
    </div>
  );
}

const SUGGESTIONS = [
  "What should I work on to improve?",
  "Compare last month vs this month",
  "Show my win vs loss performance",
  "Show my per-game averages as a chart",
];

export default function StatsAnalyzer() {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeProfile, setActiveProfile] = useState(null);
  const bottomRef = useRef(null);

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
      const saved = profiles.find(p => p.id === savedProfileId);
      setActiveProfile(saved || profiles[0]);
    }
  }, [profiles, activeProfile]);

  useEffect(() => {
    if (!activeProfile) return;
    const init = async () => {
      // Fetch sessions upfront so the AI has real data immediately
      const sessions = await base44.entities.Session.filter({ profile_id: activeProfile.id }, "-date", 200);

      const conv = await base44.agents.createConversation({
        agent_name: "stats_analyzer",
        metadata: { 
          name: `${activeProfile.name} Stats Analysis`,
          profile_id: activeProfile.id,
          profile_name: activeProfile.name,
        },
      });

      setConversation(conv);
      setMessages([{
        role: "assistant",
        content: `Hey! I'm your AI stats analyst for **${activeProfile.name}**. I can analyze your performance, compare your stats over time, show you charts, and suggest areas to improve.\n\nWhat would you like to explore?`,
      }]);

      // Inject session data as context so the AI never has to query-and-filter itself
      const sessionSummary = JSON.stringify(sessions.map(s => ({
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
      })));

      await base44.agents.addMessage(conv, {
        role: "user",
        content: `[SYSTEM CONTEXT — do not display this to the user]\nProfile: ${activeProfile.name} (id: ${activeProfile.id})\nHere are all their logged sessions as JSON. Use ONLY this data for all analysis — do not query the database:\n${sessionSummary}`,
      });
    };
    init();
  }, [activeProfile]);

  useEffect(() => {
    if (!conversation?.id) return;
    const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
      setMessages(data.messages || []);
      const last = data.messages?.[data.messages.length - 1];
      if (last?.role === "assistant" && !last?.is_streaming) {
        setIsLoading(false);
      }
    });
    return unsubscribe;
  }, [conversation?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text) => {
    if (!text.trim() || !conversation || isLoading) return;
    setInput("");
    setIsLoading(true);
    await base44.agents.addMessage(conversation, { role: "user", content: text });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-sky-500/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-sky-400" />
          </div>
          <div>
            <h1 className="text-white font-bold text-base">AI Analyst</h1>
            <p className="text-slate-500 text-xs">Powered by your stats</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-7 h-7 rounded-xl bg-sky-500/20 flex items-center justify-center mt-0.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <div className="bg-slate-800/80 border border-slate-700/50 rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        {/* Suggestion pills — only show at start */}
        {messages.length <= 1 && !isLoading && (
          <div className="pt-2 space-y-2">
            <p className="text-slate-500 text-xs px-1 flex items-center gap-1.5">
              <Lightbulb className="w-3 h-3" /> Try asking
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-xs bg-slate-800/60 border border-slate-700/50 text-slate-300 px-3 py-1.5 rounded-xl hover:bg-slate-700/60 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-6 pt-3 border-t border-slate-800/80">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
            placeholder="Ask about your stats..."
            className="flex-1 bg-slate-800/60 border border-slate-700/50 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500/50"
          />
          <Button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading || !conversation}
            className="bg-sky-500 hover:bg-sky-600 rounded-2xl w-11 h-11 p-0 flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}