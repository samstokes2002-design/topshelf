import React from "react";
import { ChevronDown, Plus, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export default function ProfileSwitcher({ profiles, activeProfile, onSwitch, onAdd }) {
  if (!profiles || profiles.length === 0) return null;

  const current = activeProfile || profiles[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/50 rounded-xl px-3 py-2 hover:bg-slate-700/80 transition-colors">
          <div className="w-7 h-7 rounded-full bg-sky-500/20 flex items-center justify-center overflow-hidden">
            {current.photo_url ? (
              <img src={current.photo_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <User className="w-3.5 h-3.5 text-sky-400" />
            )}
          </div>
          <span className="text-white text-sm font-medium max-w-[120px] truncate">{current.name}</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-slate-800 border-slate-700 min-w-[180px]">
        {profiles.map((p) => (
          <DropdownMenuItem
            key={p.id}
            onClick={() => onSwitch(p)}
            className={cn(
              "text-slate-300 hover:text-white focus:text-white focus:bg-slate-700",
              p.id === current?.id && "bg-slate-700/50 text-white"
            )}
          >
            <div className="w-6 h-6 rounded-full bg-sky-500/20 flex items-center justify-center mr-2 overflow-hidden">
              {p.photo_url ? (
                <img src={p.photo_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-3 h-3 text-sky-400" />
              )}
            </div>
            <span className="truncate">{p.name}</span>
            <span className="ml-auto text-[10px] text-slate-500">{p.position}</span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator className="bg-slate-700" />
        <DropdownMenuItem
          onClick={onAdd}
          className="text-sky-400 hover:text-sky-300 focus:text-sky-300 focus:bg-slate-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Profile
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}