import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, LogOut, Save, ArrowLeft, Shield, FileText, ChevronRight, Mail, UserX } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { createPageUrl } from "@/utils";

export default function Settings() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [username, setUsername] = useState("");

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me(),
  });

  React.useEffect(() => {
    if (user?.username) {
      setUsername(user.username);
    }
  }, [user]);

  const { data: blockedData } = useQuery({
    queryKey: ["blockedUsers"],
    queryFn: async () => {
      const res = await base44.functions.invoke('getBlockedUsers', {});
      return res.data;
    },
  });

  const blockedUsers = blockedData?.blocks || [];

  const unblockMutation = useMutation({
    mutationFn: (blockId) => base44.functions.invoke('unblockUser', { blockId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blockedUsers"] });
      toast({ title: "User unblocked" });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      toast({ title: "Username updated!" });
    },
  });

  const handleSaveUsername = () => {
    if (username.trim()) {
      updateUserMutation.mutate({ username: username.trim() });
    }
  };

  const handleLogout = async () => {
    await base44.auth.logout();
  };

  return (
    <div className="px-4 pb-24">
      <div className="flex items-center gap-3 py-4">
        <button onClick={() => navigate(createPageUrl("Profile"), { replace: true })} className="text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-white font-bold text-xl">Settings</h1>
      </div>

      {/* Account Section */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 mb-4">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-full bg-sky-500/20 flex items-center justify-center">
            <User className="w-6 h-6 text-sky-400" />
          </div>
          <div>
            <h2 className="text-white font-semibold">{user?.full_name || "User"}</h2>
            <p className="text-slate-400 text-xs">{user?.email}</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-slate-400 text-xs">Username</Label>
          <div className="flex gap-2">
            <Input
              placeholder="@username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-slate-900/50 border-slate-700/50 text-white rounded-xl flex-1"
            />
            <Button
              onClick={handleSaveUsername}
              disabled={!username.trim() || updateUserMutation.isPending}
              className="bg-sky-500 hover:bg-sky-600 rounded-xl"
            >
              {updateUserMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-slate-500 text-xs">Your unique username for the app</p>
        </div>
      </div>

      {/* About */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 mb-4">
        <h3 className="text-white font-semibold text-sm mb-3">About</h3>
        <div className="space-y-2 text-xs text-slate-400">
          <div className="flex justify-between">
            <span>App Version</span>
            <span className="text-white">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span>Account Type</span>
            <span className="text-white capitalize">{user?.role || "User"}</span>
          </div>
        </div>
      </div>

      {/* Legal */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden mb-4">
        <h3 className="text-white font-semibold text-sm px-4 pt-4 pb-2">Legal</h3>
        <Link to={createPageUrl("PrivacyPolicy")} className="flex items-center justify-between px-4 py-3 hover:bg-slate-700/40 transition-colors border-t border-slate-700/50">
          <div className="flex items-center gap-3">
            <Shield className="w-4 h-4 text-sky-400" />
            <span className="text-sm text-slate-200">Privacy Policy</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </Link>
        <Link to={createPageUrl("TermsOfService")} className="flex items-center justify-between px-4 py-3 hover:bg-slate-700/40 transition-colors border-t border-slate-700/50">
          <div className="flex items-center gap-3">
            <FileText className="w-4 h-4 text-sky-400" />
            <span className="text-sm text-slate-200">Terms of Service</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </Link>
        <a href="mailto:support@topshelf.app" className="flex items-center justify-between px-4 py-3 hover:bg-slate-700/40 transition-colors border-t border-slate-700/50">
          <div className="flex items-center gap-3">
            <Mail className="w-4 h-4 text-sky-400" />
            <span className="text-sm text-slate-200">Contact Support</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </a>
      </div>

      {/* Logout */}
      <Button
        onClick={handleLogout}
        variant="ghost"
        className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-xl h-12 font-semibold"
      >
        <LogOut className="w-4 h-4 mr-2" />
        Log Out
      </Button>
    </div>
  );
}