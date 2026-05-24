import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as Linking from "expo-linking";

import { useIconFonts } from "@/src/hooks/use-icon-fonts";
import { AppProvider } from "@/src/context/AppContext";

SplashScreen.preventAutoHideAsync();

// Register the home-screen widget task handler as early as possible so that
// Android can render it. Safe to no-op in Expo Go / web.
if (Platform.OS === "android") {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { registerWidgetTaskHandler } = require("react-native-android-widget");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { widgetTaskHandler } = require("@/src/widgets/widget-task-handler");
    registerWidgetTaskHandler(widgetTaskHandler);
  } catch {
    // Native module not available (Expo Go) — widget will become active once
    // the app is built with EAS / expo run:android.
  }
}

// Try to load expo-share-intent. In Expo Go it's a no-op stub.
let useShareIntent: any = () => ({ hasShareIntent: false, shareIntent: null, resetShareIntent: () => {} });
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require("expo-share-intent");
  if (mod?.useShareIntent) useShareIntent = mod.useShareIntent;
} catch {
  // not available
}

function extractFirstUrl(text?: string | null): string | null {
  if (!text) return null;
  const m = text.match(/https?:\/\/[^\s]+/i);
  return m ? m[0] : null;
}

function ShareAndDeepLinkHandler() {
  const router = useRouter();
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent();

  // Handle incoming share intents
  useEffect(() => {
    if (!hasShareIntent || !shareIntent) return;
    const text = shareIntent.text || shareIntent.webUrl || "";
    const url = extractFirstUrl(text);
    if (url) {
      router.push({ pathname: "/manual", params: { link: url, auto: "1" } });
    } else {
      router.push("/manual");
    }
    resetShareIntent();
  }, [hasShareIntent, shareIntent, resetShareIntent, router]);

  // Handle deep links like sottovoce://record (from the widget)
  useEffect(() => {
    const handleUrl = (urlStr: string | null) => {
      if (!urlStr) return;
      try {
        const parsed = Linking.parse(urlStr);
        const path = parsed.path || parsed.hostname || "";
        if (path === "record" || path === "recording") {
          router.push("/recording");
        }
      } catch {
        // ignore
      }
    };

    Linking.getInitialURL().then(handleUrl).catch(() => {});
    const sub = Linking.addEventListener("url", (e) => handleUrl(e.url));
    return () => sub.remove();
  }, [router]);

  return null;
}

export default function RootLayout() {
  const [loaded, error] = useIconFonts();

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProvider>
        <StatusBar style="auto" />
        <ShareAndDeepLinkHandler />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "fade",
          }}
        />
      </AppProvider>
    </GestureHandlerRootView>
  );
}
