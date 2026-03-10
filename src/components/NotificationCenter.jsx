import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import NotificationItem from "@/components/NotificationItem";

export default function NotificationCenter() {
  const queryClient = useQueryClient();
  const [currentUserEmail, setCurrentUserEmail] = useState(null);

  useEffect(() => {
    const fetchEmail = async () => {
      const user = await base44.auth.me();
      setCurrentUserEmail(user.email);
    };
    fetchEmail();
  }, []);

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", currentUserEmail],
    queryFn: async () => {
      if (!currentUserEmail) return [];
      const notifs = await base44.entities.Notification.filter(
        { recipient_email: currentUserEmail },
        "-created_date"
      );
      return notifs;
    },
    enabled: !!currentUserEmail,
  });

  const markReadMutation = useMutation({
    mutationFn: (notificationId) =>
      base44.entities.Notification.update(notificationId, { read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", currentUserEmail] });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId) =>
      base44.entities.Notification.delete(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", currentUserEmail] });
    },
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (!currentUserEmail) return null;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-slate-400" />
          <h2 className="text-white font-semibold">Notifications</h2>
          {unreadCount > 0 && (
            <span className="bg-sky-500/20 text-sky-400 text-xs font-semibold px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="text-center py-8 text-slate-500 text-sm">
          <Bell className="w-6 h-6 mx-auto mb-2 opacity-50" />
          <p>No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2 px-4">
          {notifications.map((notification) => (
            <div key={notification.id} className="flex items-start gap-2 group">
              <div className="flex-1 min-w-0">
                <NotificationItem
                  notification={notification}
                  onMarkRead={() => markReadMutation.mutate(notification.id)}
                />
              </div>
              <button
                onClick={() => deleteNotificationMutation.mutate(notification.id)}
                className="flex-shrink-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-red-400 mt-0.5"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}