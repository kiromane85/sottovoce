import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Platform, useColorScheme } from "react-native";
import * as ScreenOrientation from "expo-screen-orientation";

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
  carModeEnabled: boolean;
  setCarModeEnabled: (v: boolean) => void;
};

const AppContext = createContext<AppState | undefined>(undefined);

const KEY_THEME = "sottovoce:theme";
const KEY_LANG = "sottovoce:lang";
const KEY_ONBOARDED = "sottovoce:onboarded";
const KEY_CAR_MODE = "sottovoce:carmode";

export function AppProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>("auto");
  const [targetLang, setTargetLangState] = useState<string>("Italian");
  const [hasOnboarded, setHasOnboardedState] = useState<boolean>(false);
  const [carModeEnabled, setCarModeEnabledState] = useState<boolean>(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      const t = await storage.getItem<string>(KEY_THEME, "auto");
      const l = await storage.getItem<string>(KEY_LANG, "Italian");
      const o = await storage.getItem<boolean>(KEY_ONBOARDED, false);
      const c = await storage.getItem<boolean>(KEY_CAR_MODE, false);
      if (t === "light" || t === "dark" || t === "auto") setThemeModeState(t);
      if (l) setTargetLangState(l);
      setHasOnboardedState(!!o);
      setCarModeEnabledState(!!c);
      setHydrated(true);
    })();
  }, []);

  // Lock orientation when car mode toggles
  useEffect(() => {
    if (!hydrated) return;
    if (Platform.OS === "web") return;
    if (carModeEnabled) {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => {});
    } else {
      ScreenOrientation.unlockAsync().catch(() => {});
    }
  }, [carModeEnabled, hydrated]);

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

  const setCarModeEnabled = useCallback((v: boolean) => {
    setCarModeEnabledState(v);
    storage.setItem(KEY_CAR_MODE, v);
  }, []);

  const isDark =
    themeMode === "dark" || (themeMode === "auto" && system === "dark") || carModeEnabled;
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
      carModeEnabled,
      setCarModeEnabled,
    }),
    [
      themeMode,
      colors,
      isDark,
      setThemeMode,
      targetLang,
      setTargetLang,
      hasOnboarded,
      setHasOnboarded,
      carModeEnabled,
      setCarModeEnabled,
    ]
  );

  if (!hydrated) return null;
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
