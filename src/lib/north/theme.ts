export type ThemeName = "dawn" | "day" | "dusk" | "night";

export const THEME_LABELS: Record<ThemeName, string> = {
  dawn: "şafak",
  day: "gün",
  dusk: "akşam",
  night: "gece",
};

export function themeForHour(hour: number): ThemeName {
  const h = ((Math.round(hour) % 24) + 24) % 24;
  if (h >= 6 && h < 11) return "dawn";
  if (h >= 11 && h < 17) return "day";
  if (h >= 17 && h < 21) return "dusk";
  return "night";
}

export function formatHour(hour: number): string {
  return `${String(((Math.round(hour) % 24) + 24) % 24).padStart(2, "0")}:00`;
}
