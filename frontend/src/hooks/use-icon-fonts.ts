// Icon font loader with multi-CDN fallback.
// Many VPNs / corporate networks / national firewalls block specific CDNs.
// We try sources in this order: unpkg → jsdelivr → our own backend.
// `Font.loadAsync` registers a font under the family name passed as key.
// If a source returns an empty/invalid file, it throws and we move on.

import Constants, { ExecutionEnvironment } from "expo-constants";
import * as Font from "expo-font";
import { useEffect, useState } from "react";
import { Platform } from "react-native";

const ICON_VECTOR_VERSION = "15.1.1";

const ICON_FAMILIES = [
  "AntDesign",
  "Entypo",
  "EvilIcons",
  "Feather",
  "FontAwesome",
  "FontAwesome5_Brands",
  "FontAwesome5_Regular",
  "FontAwesome5_Solid",
  "FontAwesome6_Brands",
  "FontAwesome6_Regular",
  "FontAwesome6_Solid",
  "Fontisto",
  "Foundation",
  "Ionicons",
  "MaterialCommunityIcons",
  "MaterialIcons",
  "Octicons",
  "SimpleLineIcons",
  "Zocial",
] as const;

type IconFamily = (typeof ICON_FAMILIES)[number];

type Source = (family: IconFamily) => string;

const SOURCES: Source[] = [
  // unpkg — usually accessible behind most VPNs
  (f) =>
    `https://unpkg.com/@expo/vector-icons@${ICON_VECTOR_VERSION}/build/vendor/react-native-vector-icons/Fonts/${f}.ttf`,
  // jsdelivr — fast on most networks
  (f) =>
    `https://cdn.jsdelivr.net/npm/@expo/vector-icons@${ICON_VECTOR_VERSION}/build/vendor/react-native-vector-icons/Fonts/${f}.ttf`,
  // Our own backend — guaranteed reachable from the app
  (f) => `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/fonts/${f}.ttf`,
];

const shouldUseRemoteFonts = (): boolean => {
  const env = Constants.executionEnvironment;
  if (env === ExecutionEnvironment.StoreClient) return true;
  if (__DEV__ && Platform.OS !== "web") return true;
  return false;
};

async function loadFromSource(source: Source, timeoutMs = 7000): Promise<void> {
  const map: Record<string, string> = {};
  for (const f of ICON_FAMILIES) map[f] = source(f);
  await Promise.race([
    Font.loadAsync(map),
    new Promise<void>((_, reject) =>
      setTimeout(() => reject(new Error("font load timeout")), timeoutMs),
    ),
  ]);
}

export const useIconFonts = (): readonly [boolean, Error | null] => {
  const [loaded, setLoaded] = useState<boolean>(!shouldUseRemoteFonts());
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!shouldUseRemoteFonts()) return;
    let cancelled = false;
    (async () => {
      let lastError: Error | null = null;
      for (const source of SOURCES) {
        try {
          await loadFromSource(source);
          if (!cancelled) {
            setLoaded(true);
            setError(null);
          }
          return;
        } catch (e) {
          lastError = e as Error;
          // try next source
        }
      }
      if (!cancelled) {
        // All sources failed — let the app render anyway so the user is not
        // stuck on a blank splash. Icons will fall back to missing glyphs.
        setLoaded(true);
        setError(lastError);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return [loaded, error] as const;
};
