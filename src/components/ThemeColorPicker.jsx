import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Palette, Check } from "lucide-react";

const PRESETS = {
  primary: [
    { label: "Sky", value: "#0EA5E9" },
    { label: "Indigo", value: "#6366F1" },
    { label: "Violet", value: "#8B5CF6" },
    { label: "Rose", value: "#F43F5E" },
    { label: "Amber", value: "#F59E0B" },
    { label: "Emerald", value: "#10B981" },
    { label: "Orange", value: "#F97316" },
    { label: "Teal", value: "#14B8A6" },
  ],
  secondary: [
    { label: "Slate", value: "#475569" },
    { label: "Gray", value: "#4B5563" },
    { label: "Zinc", value: "#52525B" },
    { label: "Stone", value: "#57534E" },
    { label: "Blue", value: "#3B82F6" },
    { label: "Purple", value: "#A855F7" },
    { label: "Pink", value: "#EC4899" },
    { label: "Cyan", value: "#06B6D4" },
  ],
  button: [
    { label: "Sky", value: "#0EA5E9" },
    { label: "Indigo", value: "#6366F1" },
    { label: "Violet", value: "#8B5CF6" },
    { label: "Rose", value: "#F43F5E" },
    { label: "Amber", value: "#F59E0B" },
    { label: "Emerald", value: "#10B981" },
    { label: "Orange", value: "#F97316" },
    { label: "Teal", value: "#14B8A6" },
  ],
};

function hexToHsl(hex) {
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function applyColors(primary, secondary, button) {
  const root = document.documentElement;
  root.style.setProperty("--primary", hexToHsl(primary));
  root.style.setProperty("--ring", hexToHsl(primary));
  root.style.setProperty("--secondary-accent", hexToHsl(secondary));
  root.style.setProperty("--button-color", button);
}

export default function ThemeColorPicker() {
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me(),
  });

  const { data: prefs } = useQuery({
    queryKey: ["userPreferences", user?.email],
    queryFn: async () => {
      const results = await base44.entities.UserPreferences.filter({ user_email: user.email });
      return results[0] || null;
    },
    enabled: !!user?.email,
  });

  const [primary, setPrimary] = useState("#0EA5E9");
  const [secondary, setSecondary] = useState("#475569");
  const [button, setButton] = useState("#0EA5E9");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (prefs) {
      setPrimary(prefs.primary_color || "#0EA5E9");
      setSecondary(prefs.secondary_color || "#475569");
      setButton(prefs.button_color || "#0EA5E9");
    }
  }, [prefs]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const data = { user_email: user.email, primary_color: primary, secondary_color: secondary, button_color: button };
      if (prefs?.id) {
        return base44.entities.UserPreferences.update(prefs.id, data);
      } else {
        return base44.entities.UserPreferences.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userPreferences"] });
      applyColors(primary, secondary, button);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const handlePreview = (type, value) => {
    if (type === "primary") { setPrimary(value); applyColors(value, secondary, button); }
    if (type === "secondary") { setSecondary(value); applyColors(primary, value, button); }
    if (type === "button") { setButton(value); applyColors(primary, secondary, value); }
  };

  const ColorRow = ({ label, type, value }) => (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-slate-300 text-sm font-medium">{label}</span>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full border-2 border-slate-600" style={{ backgroundColor: value }} />
          <input
            type="color"
            value={value}
            onChange={(e) => handlePreview(type, e.target.value)}
            className="w-8 h-6 rounded cursor-pointer bg-transparent border-0 p-0"
            title="Custom color"
          />
        </div>
      </div>
      <div className="flex gap-2 flex-wrap">
        {PRESETS[type].map((preset) => (
          <button
            key={preset.value}
            onClick={() => handlePreview(type, preset.value)}
            title={preset.label}
            className="w-7 h-7 rounded-full border-2 transition-all hover:scale-110 active:scale-95"
            style={{
              backgroundColor: preset.value,
              borderColor: value === preset.value ? "white" : "transparent",
            }}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 mb-4">
      <div className="flex items-center gap-2 mb-4">
        <Palette className="w-4 h-4 text-sky-400" />
        <h3 className="text-white font-semibold text-sm">Interface Colors</h3>
      </div>

      <ColorRow label="Primary Color" type="primary" value={primary} />
      <ColorRow label="Secondary Color" type="secondary" value={secondary} />
      <ColorRow label="Button Color" type="button" value={button} />

      <button
        onClick={() => saveMutation.mutate()}
        disabled={saveMutation.isPending}
        className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all mt-2 flex items-center justify-center gap-2"
        style={{ backgroundColor: button, color: "white" }}
      >
        {saved ? (
          <><Check className="w-4 h-4" /> Saved!</>
        ) : saveMutation.isPending ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          "Save Colors"
        )}
      </button>
    </div>
  );
}