import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction, className }) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-6 text-center", className)}>
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center mb-4">
          <Icon className="w-7 h-7 text-slate-500" />
        </div>
      )}
      <h3 className="text-white font-semibold text-lg mb-1">{title}</h3>
      <p className="text-slate-400 text-sm max-w-[260px] mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          className="bg-sky-500 hover:bg-sky-600 text-white rounded-xl px-6"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}