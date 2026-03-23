import { useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

function hexToHsl(hex) {
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
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

export function useTheme() {
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

  useEffect(() => {
    const root = document.documentElement;
    const primary = prefs?.primary_color || "#0EA5E9";
    const button = prefs?.button_color || "#0EA5E9";
    const secondary = prefs?.secondary_color || "#475569";

    root.style.setProperty("--primary", hexToHsl(primary));
    root.style.setProperty("--ring", hexToHsl(primary));
    root.style.setProperty("--button-color", button);
    root.style.setProperty("--secondary-accent", hexToHsl(secondary));
  }, [prefs]);

  return prefs;
}