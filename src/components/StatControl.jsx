import React from "react";
import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export default function StatControl({ label, value, onChange, color = "text-white", allowNegative = false }) {
  const decrement = () => {
    const newValue = allowNegative ? (value || 0) - 1 : Math.max(0, (value || 0) - 1);
    onChange(newValue);
  };

  const increment = () => {
    const newValue = (value || 0) + 1;
    onChange(newValue);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-[10px] text-slate-400 uppercase tracking-wider">{label}</span>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="icon"
          onClick={decrement}
          className="h-8 w-8 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300"
        >
          <Minus className="w-3 h-3" />
        </Button>
        <span className="text-2xl font-bold w-12 text-center text-white">{value || 0}</span>
        <Button
          type="button"
          size="icon"
          onClick={increment}
          className="h-8 w-8 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300"
        >
          <Plus className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}