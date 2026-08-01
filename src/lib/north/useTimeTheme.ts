import { useCallback, useEffect, useState } from "react";
import { themeForHour, type ThemeName } from "./theme";

interface TimeThemeOptions {
  autoTime: boolean;
  manualHour: number | null;
  onChange: (next: { autoTime: boolean; manualHour: number | null }) => void;
}

/** Applies the time-of-day theme to <html data-theme> and keeps it ticking. */
export function useTimeTheme({ autoTime, manualHour, onChange }: TimeThemeOptions) {
  const [deviceHour, setDeviceHour] = useState(12);

  useEffect(() => {
    const tick = () => setDeviceHour(new Date().getHours());
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);

  const hour = autoTime ? deviceHour : (manualHour ?? deviceHour);
  const theme: ThemeName = themeForHour(hour);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const setHour = useCallback(
    (next: number) => onChange({ autoTime: false, manualHour: next }),
    [onChange],
  );
  const setAutoTime = useCallback(
    (next: boolean) => onChange({ autoTime: next, manualHour: next ? null : hour }),
    [hour, onChange],
  );

  return { hour, theme, setHour, setAutoTime };
}
