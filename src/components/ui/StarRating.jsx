import React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export default function StarRating({ value = 0, onChange, size = "md", readOnly = false }) {
  const sizeClass = size === "sm" ? "w-4 h-4" : size === "lg" ? "w-7 h-7" : "w-5 h-5";
  
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(star)}
          className={cn(
            "transition-all duration-150",
            !readOnly && "hover:scale-110 active:scale-95 cursor-pointer",
            readOnly && "cursor-default"
          )}
        >
          <Star
            className={cn(
              sizeClass,
              "transition-colors",
              star <= value
                ? "fill-amber-400 text-amber-400"
                : "fill-transparent text-slate-600"
            )}
          />
        </button>
      ))}
    </div>
  );
}