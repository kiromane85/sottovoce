// Icon font loader for Expo apps. Fonts are loaded from a CDN under Expo Go
// (StoreClient) because @expo/vector-icons' bundled .ttf files come back as
// 0 bytes from Metro's asset resolver on Android. Native dev/prod builds use
// react-native-vector-icons autolinking; web uses CDN as well as a safety net.
// ICON_VECTOR_VERSION should match @expo/vector-icons in package.json.
// Usage: const [loaded, error] = useIconFonts();

import Constants, { ExecutionEnvironment } from "expo-constants";
import { useFonts } from "expo-font";
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

const iconFontMap = (): Record<IconFamily, string> =>
  Object.fromEntries(
    ICON_FAMILIES.map((f) => [
      f,
      `https://cdn.jsdelivr.net/npm/@expo/vector-icons@${ICON_VECTOR_VERSION}/build/vendor/react-native-vector-icons/Fonts/${f}.ttf`,
    ]),
  ) as Record<IconFamily, string>;

// Load CDN fonts whenever we're in Expo Go (StoreClient) OR when the bundled
// fonts may be unreliable (dev client on Android with Metro). Standalone /
// production builds have proper native autolinking and don't need the CDN.
const shouldUseCdnFonts = (): boolean => {
  const env = Constants.executionEnvironment;
  if (env === ExecutionEnvironment.StoreClient) return true;
  // In dev (any platform) safer to load from CDN to avoid empty-font issues.
  if (__DEV__ && Platform.OS !== "web") return true;
  return false;
};

export const useIconFonts = (): readonly [boolean, Error | null] =>
  useFonts(shouldUseCdnFonts() ? iconFontMap() : {});
