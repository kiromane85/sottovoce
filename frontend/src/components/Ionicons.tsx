// Drop-in replacement for `@expo/vector-icons` Ionicons that uses
// `lucide-react-native` (SVG) under the hood. SVG icons render without
// requiring TTF font files, so they work reliably even when Expo Go's font
// loader fails (Android Metro empty-file bug, VPN/firewall blocking CDNs).
//
// Usage stays identical:
//   <Ionicons name="mic" size={24} color="#000" />

import React from "react";
import {
  AlertCircle,
  AlertTriangle,
  Album,
  ArrowDownCircle,
  Car,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Contact,
  Edit3,
  Globe,
  Info,
  Mic,
  MicOff,
  Minimize2,
  Moon,
  Music,
  Music2,
  Pause,
  Pencil,
  Play,
  RotateCcw,
  Settings,
  Smartphone,
  Sparkles,
  Square,
  Sun,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react-native";

const ICON_MAP: Record<string, LucideIcon> = {
  // Music / app
  "musical-note": Music2,
  "musical-notes": Music,
  // Mic / recording
  mic: Mic,
  "mic-off-outline": MicOff,
  stop: Square,
  play: Play,
  pause: Pause,
  refresh: RotateCcw,
  // Navigation / UI
  "chevron-back": ChevronLeft,
  "chevron-forward": ChevronRight,
  close: X,
  "contract-outline": Minimize2,
  "arrow-down-circle": ArrowDownCircle,
  // Status / info
  "alert-circle-outline": AlertCircle,
  "warning-outline": AlertTriangle,
  "information-circle-outline": Info,
  checkmark: Check,
  "checkmark-circle": CheckCircle2,
  // Entities
  "create-outline": Pencil,
  "sparkles-outline": Sparkles,
  "albums-outline": Album,
  "time-outline": Clock,
  "settings-outline": Settings,
  "globe-outline": Globe,
  "trash-outline": Trash2,
  "car-sport-outline": Car,
  // Theme
  "moon-outline": Moon,
  "sunny-outline": Sun,
  "phone-portrait-outline": Smartphone,
};

type Props = {
  name: string;
  size?: number;
  color?: string;
  style?: any;
};

export function Ionicons({ name, size = 24, color = "#000000", style }: Props) {
  const Cmp = ICON_MAP[name] ?? Contact;
  return <Cmp size={size} color={color} style={style} />;
}

export type IoniconName = keyof typeof ICON_MAP;

// Default export for convenience
export default Ionicons;
