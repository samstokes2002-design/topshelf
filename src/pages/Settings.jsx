import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, LogOut, Save, ArrowLeft, Shield, FileText, ChevronRight, Mail, Download, Trash2, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { createPageUrl } from "@/utils";

export default function Settings() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [username, setUsername] = useState("");

  const [showDeleteProfileConfirm, setShowDeleteProfileConfirm] = useState(false);
  const [showDeleteAccountConfirm, setShowDeleteAccountConfirm] = useState(false);
  const [deleteProfileText, setDeleteProfileText] = useState("");
  const [deleteAccountText, setDeleteAccountText] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [isDeletingProfile, setIsDeletingProfile] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportMessage, setSupportMessage] = useState("");
  const [isSendingSupport, setIsSendingSupport] = useState(false);
  const [supportSent, setSupportSent] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me(),
  });

  React.useEffect(() => {
    if (user?.username) {
      setUsername(user.username);
    }
  }, [user]);

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

  const getActiveProfileId = async () => {
    const currentUser = await base44.auth.me();
    const savedId = localStorage.getItem("activeProfileId");
    const profiles = await base44.entities.Profile.filter({ created_by: currentUser.email });
    if (savedId && profiles.find(p => p.id === savedId)) return savedId;
    return profiles[0]?.id || null;
  };

  const handleExport = async () => {
    setIsExporting(true);
    const profileId = await getActiveProfileId();
    if (!profileId) { setIsExporting(false); return; }
    const res = await base44.functions.invoke('exportProfileData', { profileId });
    const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `topshelf-data-${res.data.profile?.username || 'export'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setIsExporting(false);
  };

  const handleDeleteProfile = async () => {
    setIsDeletingProfile(true);
    const profileId = await getActiveProfileId();
    if (!profileId) { setIsDeletingProfile(false); return; }
    await base44.functions.invoke('deleteProfile', { profileId });
    localStorage.removeItem("activeProfileId");
    window.location.href = createPageUrl("Home");
  };

  const handleContactSupport = async () => {
    if (!supportMessage.trim()) return;
    setIsSendingSupport(true);
    const profileId = await getActiveProfileId();
    await base44.functions.invoke('contactSupport', { message: supportMessage, profileId });
    setIsSendingSupport(false);
    setSupportSent(true);
    setSupportMessage("");
    setTimeout(() => { setShowSupportModal(false); setSupportSent(false); }, 2000);
  };

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    await base44.functions.invoke('deleteAccount', {});
    localStorage.clear();
    base44.auth.logout("/");
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
        <button onClick={() => { setShowSupportModal(true); setSupportSent(false); setSupportMessage(""); }} className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-700/40 transition-colors border-t border-slate-700/50">
          <div className="flex items-center gap-3">
            <Mail className="w-4 h-4 text-sky-400" />
            <span className="text-sm text-slate-200">Contact Support</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      {/* Account Management */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden mb-4">
        <h3 className="text-white font-semibold text-sm px-4 pt-4 pb-2">Account Management</h3>
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-700/40 transition-colors border-t border-slate-700/50"
        >
          <div className="flex items-center gap-3">
            <Download className="w-4 h-4 text-sky-400" />
            <span className="text-sm text-slate-200">Export My Data</span>
          </div>
          {isExporting
            ? <div className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
            : <ChevronRight className="w-4 h-4 text-slate-500" />}
        </button>
        <button
          onClick={() => { setShowDeleteProfileConfirm(true); setDeleteProfileText(""); }}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-red-500/10 transition-colors border-t border-slate-700/50"
        >
          <div className="flex items-center gap-3">
            <Trash2 className="w-4 h-4 text-red-400" />
            <div className="text-left">
              <span className="text-sm text-red-400 block">Delete Profile</span>
              <span className="text-xs text-slate-500">Remove active profile only</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>
        <button
          onClick={() => { setShowDeleteAccountConfirm(true); setDeleteAccountText(""); }}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-red-500/10 transition-colors border-t border-slate-700/50"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <div className="text-left">
              <span className="text-sm text-red-500 block font-semibold">Delete Account</span>
              <span className="text-xs text-slate-500">Permanently remove everything</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>
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

      {/* Contact Support Modal */}
      {showSupportModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold text-lg">Contact Support</h3>
              <button onClick={() => setShowSupportModal(false)} className="text-slate-400 hover:text-white">
                <span className="text-xl leading-none">×</span>
              </button>
            </div>
            {supportSent ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-3">
                  <Mail className="w-6 h-6 text-emerald-400" />
                </div>
                <p className="text-emerald-400 font-semibold">Message sent!</p>
                <p className="text-slate-400 text-sm mt-1">We'll get back to you soon.</p>
              </div>
            ) : (
              <>
                <p className="text-slate-400 text-sm mb-4">Describe your issue or question and we'll get back to you.</p>
                <textarea
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  placeholder="Describe your issue..."
                  className="w-full bg-slate-900/50 border border-slate-700/50 text-white rounded-xl p-3 text-sm resize-none h-28 outline-none focus:border-sky-500 mb-4"
                />
                <div className="flex gap-3">
                  <button onClick={() => setShowSupportModal(false)} className="flex-1 py-2.5 rounded-xl bg-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-600 transition-colors">
                    Cancel
                  </button>
                  <button
                    onClick={handleContactSupport}
                    disabled={!supportMessage.trim() || isSendingSupport}
                    className="flex-1 py-2.5 rounded-xl bg-sky-500/20 text-sky-400 text-sm font-medium hover:bg-sky-500/30 transition-colors disabled:opacity-50"
                  >
                    {isSendingSupport ? "Sending..." : "Send"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Delete Profile Modal */}
      {showDeleteProfileConfirm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500/20 mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="text-white font-bold text-center text-lg mb-1">Delete Profile?</h3>
            <p className="text-slate-400 text-sm text-center mb-4">
              This removes your active profile and all its sessions and stats. Other profiles remain. This cannot be undone.
            </p>
            <p className="text-slate-400 text-xs text-center mb-3">
              Type <span className="text-red-400 font-mono font-bold">DELETE</span> to confirm
            </p>
            <input
              type="text"
              value={deleteProfileText}
              onChange={(e) => setDeleteProfileText(e.target.value)}
              placeholder="Type DELETE"
              className="w-full bg-slate-900/50 border border-slate-700/50 text-white rounded-xl px-3 py-2 text-sm mb-4 outline-none focus:border-red-500/50"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteProfileConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProfile}
                disabled={deleteProfileText !== "DELETE" || isDeletingProfile}
                className="flex-1 py-2.5 rounded-xl bg-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/30 transition-colors disabled:opacity-40"
              >
                {isDeletingProfile ? "Deleting..." : "Delete Profile"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteAccountConfirm && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center px-4">
          <div className="bg-slate-800 border border-red-900/50 rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500/20 mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-white font-bold text-center text-lg mb-1">Delete Account?</h3>
            <p className="text-slate-400 text-sm text-center mb-2">
              This will <span className="text-red-400 font-semibold">permanently delete</span> your entire account including:
            </p>
            <ul className="text-slate-500 text-xs text-center mb-4 space-y-0.5">
              <li>All profiles &amp; stats</li>
              <li>All sessions &amp; seasons</li>
              <li>All friends &amp; connections</li>
            </ul>
            <p className="text-slate-400 text-xs text-center mb-1">You can re-register with the same email later.</p>
            <p className="text-slate-400 text-xs text-center mb-3">
              Type <span className="text-red-500 font-mono font-bold">DELETE ACCOUNT</span> to confirm
            </p>
            <input
              type="text"
              value={deleteAccountText}
              onChange={(e) => setDeleteAccountText(e.target.value)}
              placeholder="Type DELETE ACCOUNT"
              className="w-full bg-slate-900/50 border border-red-900/50 text-white rounded-xl px-3 py-2 text-sm mb-4 outline-none focus:border-red-500/50"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteAccountConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteAccountText !== "DELETE ACCOUNT" || isDeletingAccount}
                className="flex-1 py-2.5 rounded-xl bg-red-500/30 text-red-400 text-sm font-semibold hover:bg-red-500/40 transition-colors disabled:opacity-40"
              >
                {isDeletingAccount ? "Deleting..." : "Delete Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}