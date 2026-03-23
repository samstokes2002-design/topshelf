import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Palette, Check } from "lucide-react";
import { applyTheme } from "@/hooks/useTheme";

const PRESETS = {
  background: [
    { label: "Dark Navy", value: "#0B1120" },
    { label: "Deep Blue", value: "#0D1B2A" },
    { label: "Charcoal", value: "#111827" },
    { label: "Near Black", value: "#09090B" },
    { label: "Dark Slate", value: "#0F172A" },
    { label: "Dark Green", value: "#052E16" },
    { label: "Dark Purple", value: "#1A0A2E" },
    { label: "Dark Red", value: "#1C0A0A" },
  ],
  panel: [
    { label: "Navy Panel", value: "#131F35" },
    { label: "Blue Panel", value: "#162032" },
    { label: "Gray Panel", value: "#1F2937" },
    { label: "Zinc Panel", value: "#18181B" },
    { label: "Slate Panel", value: "#1E293B" },
    { label: "Green Panel", value: "#064E3B" },
    { label: "Purple Panel", value: "#2D1B69" },
    { label: "Red Panel", value: "#3B1515" },
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

  const [background, setBackground] = useState("#0B1120");
  const [panel, setPanel] = useState("#131F35");
  const [button, setButton] = useState("#0EA5E9");
  const [foreground, setForeground] = useState("white");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (prefs) {
      setBackground(prefs.background_color || "#0B1120");
      setPanel(prefs.panel_color || "#131F35");
      setButton(prefs.button_color || "#0EA5E9");
      setForeground(prefs.foreground_color || "white");
    }
  }, [prefs]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const data = {
        user_email: user.email,
        background_color: background,
        panel_color: panel,
        button_color: button,
        foreground_color: foreground,
      };
      if (prefs?.id) {
        return base44.entities.UserPreferences.update(prefs.id, data);
      } else {
        return base44.entities.UserPreferences.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userPreferences"] });
      applyTheme({ background_color: background, panel_color: panel, button_color: button, foreground_color: foreground });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const handlePreview = (type, value) => {
    const next = { background, panel, button, foreground };
    if (type === "background") { next.background = value; setBackground(value); }
    else if (type === "panel") { next.panel = value; setPanel(value); }
    else if (type === "button") { next.button = value; setButton(value); }
    else if (type === "foreground") { next.foreground = value; setForeground(value); }
    applyTheme({ background_color: next.background, panel_color: next.panel, button_color: next.button, foreground_color: next.foreground });
  };

  const ColorRow = ({ label, type, value }) => (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-foreground text-sm font-medium">{label}</span>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full border-2 border-border" style={{ backgroundColor: value }} />
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
    <div className="bg-card border border-border rounded-2xl p-4 mb-4">
      <div className="flex items-center gap-2 mb-4">
        <Palette className="w-4 h-4 text-primary" />
        <h3 className="text-foreground font-semibold text-sm">Interface Colors</h3>
      </div>

      <ColorRow label="Background Color" type="background" value={background} />
      <ColorRow label="Panel Color" type="panel" value={panel} />
      <ColorRow label="Button Color" type="button" value={button} />

      {/* Text Color Toggle */}
      <div className="mb-4">
        <span className="text-foreground text-sm font-medium block mb-2">Text Color</span>
        <div className="flex gap-2">
          <button
            onClick={() => handlePreview("foreground", "white")}
            className="flex-1 py-2 rounded-xl border-2 text-sm font-semibold transition-all"
            style={{
              backgroundColor: "#1a1a2e",
              color: "white",
              borderColor: foreground === "white" ? "white" : "transparent",
            }}
          >
            White
          </button>
          <button
            onClick={() => handlePreview("foreground", "black")}
            className="flex-1 py-2 rounded-xl border-2 text-sm font-semibold transition-all"
            style={{
              backgroundColor: "#f0f0f0",
              color: "black",
              borderColor: foreground === "black" ? "#333" : "transparent",
            }}
          >
            Black
          </button>
        </div>
      </div>

      <button
        onClick={() => saveMutation.mutate()}
        disabled={saveMutation.isPending}
        className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all mt-2 flex items-center justify-center gap-2 text-white"
        style={{ backgroundColor: button }}
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