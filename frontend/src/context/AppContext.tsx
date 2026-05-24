import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useColorScheme } from "react-native";

import { storage } from "@/src/utils/storage";
import { ColorPalette, darkColors, lightColors } from "@/src/theme/colors";

export type ThemeMode = "light" | "dark" | "auto";

type AppState = {
  themeMode: ThemeMode;
  colors: ColorPalette;
  isDark: boolean;
  setThemeMode: (m: ThemeMode) => void;
  targetLang: string;
  setTargetLang: (l: string) => void;
  hasOnboarded: boolean;
  setHasOnboarded: (v: boolean) => void;
};

const AppContext = createContext<AppState | undefined>(undefined);

const KEY_THEME = "sottovoce:theme";
const KEY_LANG = "sottovoce:lang";
const KEY_ONBOARDED = "sottovoce:onboarded";

export function AppProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>("auto");
  const [targetLang, setTargetLangState] = useState<string>("Italian");
  const [hasOnboarded, setHasOnboardedState] = useState<boolean>(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      const t = await storage.getItem<string>(KEY_THEME, "auto");
      const l = await storage.getItem<string>(KEY_LANG, "Italian");
      const o = await storage.getItem<boolean>(KEY_ONBOARDED, false);
      if (t === "light" || t === "dark" || t === "auto") setThemeModeState(t);
      if (l) setTargetLangState(l);
      setHasOnboardedState(!!o);
      setHydrated(true);
    })();
  }, []);

  const setThemeMode = useCallback((m: ThemeMode) => {
    setThemeModeState(m);
    storage.setItem(KEY_THEME, m);
  }, []);

  const setTargetLang = useCallback((l: string) => {
    setTargetLangState(l);
    storage.setItem(KEY_LANG, l);
  }, []);

  const setHasOnboarded = useCallback((v: boolean) => {
    setHasOnboardedState(v);
    storage.setItem(KEY_ONBOARDED, v);
  }, []);

  const isDark =
    themeMode === "dark" || (themeMode === "auto" && system === "dark");
  const colors = isDark ? darkColors : lightColors;

  const value = useMemo<AppState>(
    () => ({
      themeMode,
      colors,
      isDark,
      setThemeMode,
      targetLang,
      setTargetLang,
      hasOnboarded,
      setHasOnboarded,
    }),
    [themeMode, colors, isDark, setThemeMode, targetLang, setTargetLang, hasOnboarded, setHasOnboarded]
  );

  if (!hydrated) return null;
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
