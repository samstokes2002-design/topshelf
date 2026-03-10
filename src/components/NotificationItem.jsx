import React from "react";
import { format } from "date-fns";
import { CheckCircle2, XCircle, Heart, User } from "lucide-react";
import { cn } from "@/lib/utils";

const notificationConfig = {
  friend_request_accepted: {
    icon: CheckCircle2,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    title: (name) => `${name} accepted your friend request`,
  },
  friend_request_declined: {
    icon: XCircle,
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    title: (name) => `${name} declined your friend request`,
  },
  friend_session_logged: {
    icon: Heart,
    color: "text-sky-400",
    bgColor: "bg-sky-500/10",
    title: (name) => `${name} logged a new session`,
  },
};

export default function NotificationItem({ notification, onMarkRead }) {
  const config = notificationConfig[notification.type];
  if (!config) return null;

  const Icon = config.icon;
  const displayName = `@${notification.actor_username}`;

  return (
    <div
      onClick={() => !notification.read && onMarkRead?.(notification.id)}
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer",
        notification.read
          ? "bg-slate-800/30 border-slate-700/20"
          : "bg-slate-800/60 border-slate-700/50 hover:bg-slate-800/80"
      )}
    >
      <div className={cn("flex-shrink-0 p-2 rounded-lg", config.bgColor)}>
        <Icon className={cn("w-4 h-4", config.color)} />
      </div>

      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium", notification.read ? "text-slate-400" : "text-white")}>
          {config.title(displayName)}
        </p>
        <p className="text-xs text-slate-500 mt-0.5">
          {format(new Date(notification.created_date), "MMM d, h:mm a")}
        </p>
      </div>

      {!notification.read && (
        <div className="flex-shrink-0 w-2 h-2 rounded-full bg-sky-400 mt-1" />
      )}
    </div>
  );
}