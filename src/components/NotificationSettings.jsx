import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function NotificationSettings() {
  const [settings, setSettings] = useState({
    notifications_enabled: true,
    notifications_friend_request_accepted: true,
    notifications_friend_request_declined: true,
    notifications_friend_session_logged: true,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const user = await base44.auth.me();
        setSettings({
          notifications_enabled: user.notifications_enabled ?? true,
          notifications_friend_request_accepted: user.notifications_friend_request_accepted ?? true,
          notifications_friend_request_declined: user.notifications_friend_request_declined ?? true,
          notifications_friend_session_logged: user.notifications_friend_session_logged ?? true,
        });
      } catch (error) {
        console.error("Error fetching notification settings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const updateMutation = useMutation({
    mutationFn: (newSettings) => base44.auth.updateMe(newSettings),
    onSuccess: (updatedUser) => {
      setSettings({
        notifications_enabled: updatedUser.notifications_enabled ?? true,
        notifications_friend_request_accepted: updatedUser.notifications_friend_request_accepted ?? true,
        notifications_friend_request_declined: updatedUser.notifications_friend_request_declined ?? true,
        notifications_friend_session_logged: updatedUser.notifications_friend_session_logged ?? true,
      });
    },
  });

  const handleToggle = (key) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    updateMutation.mutate(newSettings);
  };

  if (loading) {
    return <div className="text-slate-400 text-sm">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <Label className="text-white font-semibold text-sm cursor-pointer">Enable Notifications</Label>
            <p className="text-slate-500 text-xs mt-1">Master toggle for all notifications</p>
          </div>
          <Switch
            checked={settings.notifications_enabled}
            onCheckedChange={() => handleToggle("notifications_enabled")}
            disabled={updateMutation.isPending}
          />
        </div>
      </div>

      {settings.notifications_enabled && (
        <div className="space-y-2">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Notification Types</p>

          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label className="text-white font-medium text-sm cursor-pointer">Friend Request Accepted</Label>
                <p className="text-slate-500 text-xs mt-1">When someone accepts your friend request</p>
              </div>
              <Switch
                checked={settings.notifications_friend_request_accepted}
                onCheckedChange={() => handleToggle("notifications_friend_request_accepted")}
                disabled={updateMutation.isPending}
              />
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label className="text-white font-medium text-sm cursor-pointer">Friend Request Declined</Label>
                <p className="text-slate-500 text-xs mt-1">When someone declines your friend request</p>
              </div>
              <Switch
                checked={settings.notifications_friend_request_declined}
                onCheckedChange={() => handleToggle("notifications_friend_request_declined")}
                disabled={updateMutation.isPending}
              />
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label className="text-white font-medium text-sm cursor-pointer">Friend Logs a Session</Label>
                <p className="text-slate-500 text-xs mt-1">When a friend logs a new game or practice</p>
              </div>
              <Switch
                checked={settings.notifications_friend_session_logged}
                onCheckedChange={() => handleToggle("notifications_friend_session_logged")}
                disabled={updateMutation.isPending}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}