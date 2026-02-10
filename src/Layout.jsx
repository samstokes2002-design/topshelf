import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, Plus, BarChart3, User, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import AuthGuard from "@/components/AuthGuard";

const navItems = [
  { name: "Home", icon: Home, page: "Home" },
  { name: "Stats", icon: BarChart3, page: "Stats" },
  { name: "Log", icon: Plus, page: "LogSession", isAction: true },
  { name: "Friends", icon: Users, page: "Friends" },
  { name: "Profile", icon: User, page: "Profile" },
];

const hideNavPages = ["CreateProfile", "EditProfile", "SessionDetail", "LogSession"];

export default function Layout({ children, currentPageName }) {
  const showNav = !hideNavPages.includes(currentPageName);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-900">
        <style>{`
        :root {
          --background: 222.2 47.4% 6.2%;
          --foreground: 210 40% 98%;
          --card: 222.2 47.4% 8%;
          --card-foreground: 210 40% 98%;
          --primary: 199 89% 48%;
          --primary-foreground: 222.2 47.4% 6.2%;
          --muted: 217.2 32.6% 17.5%;
          --muted-foreground: 215 20.2% 65.1%;
          --border: 217.2 32.6% 17.5%;
          --input: 217.2 32.6% 17.5%;
          --ring: 199 89% 48%;
          --accent: 217.2 32.6% 17.5%;
          --accent-foreground: 210 40% 98%;
          --popover: 222.2 47.4% 8%;
          --popover-foreground: 210 40% 98%;
        }
      `}</style>

      {/* Top Safe Area */}
      <div className="h-[env(safe-area-inset-top)] bg-slate-900" />

      {/* Content */}
      <div className="max-w-lg mx-auto">
        {children}
      </div>

      {/* Bottom Navigation */}
      {showNav && (
        <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800/80 z-50">
          <div className="max-w-lg mx-auto flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom)] pt-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const url = createPageUrl(item.page);
              const isActive = currentPageName === item.page;

              if (item.isAction) {
                return (
                  <Link key={item.name} to={url} className="flex flex-col items-center">
                    <div className="w-11 h-11 rounded-2xl bg-sky-500 flex items-center justify-center -mt-3 shadow-lg shadow-sky-500/30 hover:bg-sky-400 active:scale-95 transition-all">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                  </Link>
                );
              }

              return (
                <Link
                  key={item.name}
                  to={url}
                  className={cn(
                    "flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl transition-colors",
                    isActive ? "text-sky-400" : "text-slate-500 hover:text-slate-300"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
      </div>
    </AuthGuard>
  );
}