import React, { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { useApp } from "@/src/context/AppContext";
import { LyricsLine } from "@/src/lib/types";

export type ViewMode = "original" | "translation" | "both";

type Props = {
  lines: LyricsLine[];
  hasSynced: boolean;
  positionMs: number;
  mode: ViewMode;
  carMode?: boolean;
};

function findActiveIndex(lines: LyricsLine[], t: number): number {
  if (!lines.length) return -1;
  // Binary search by t_ms (assuming sorted)
  let lo = 0;
  let hi = lines.length - 1;
  let res = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const ts = lines[mid].t_ms ?? -1;
    if (ts <= t) {
      res = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return res;
}

const LINE_HEIGHT_ESTIMATE = 88;

export default function KaraokeViewer({ lines, hasSynced, positionMs, mode, carMode = false }: Props) {
  const { colors } = useApp();
  const scrollRef = useRef<ScrollView>(null);
  const [activeIdx, setActiveIdx] = useState<number>(-1);
  const offsets = useRef<Record<number, number>>({});

  useEffect(() => {
    if (!hasSynced) return;
    const i = findActiveIndex(lines, positionMs);
    if (i !== activeIdx) {
      setActiveIdx(i);
      const off = offsets.current[i];
      if (off !== undefined && scrollRef.current) {
        scrollRef.current.scrollTo({
          y: Math.max(0, off - (carMode ? 80 : 200)),
          animated: true,
        });
      }
    }
  }, [positionMs, lines, hasSynced, activeIdx, carMode]);

  if (!lines.length) {
    return (
      <View style={styles.empty}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          Nessun testo disponibile per questo brano.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      ref={scrollRef}
      style={{ flex: 1 }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: carMode ? 40 : 80, paddingBottom: carMode ? 80 : 200 },
      ]}
      showsVerticalScrollIndicator={false}
      testID="karaoke-scroll"
    >
      {lines.map((line, i) => {
        const isActive = hasSynced && i === activeIdx;
        return (
          <KaraokeLine
            key={`${i}-${line.t_ms ?? "no-ts"}`}
            line={line}
            active={isActive}
            mode={mode}
            carMode={carMode}
            colors={colors}
            onLayout={(e) => {
              offsets.current[i] = e.nativeEvent.layout.y;
            }}
          />
        );
      })}
    </ScrollView>
  );
}

function KaraokeLine({
  line,
  active,
  mode,
  carMode,
  colors,
  onLayout,
}: {
  line: LyricsLine;
  active: boolean;
  mode: ViewMode;
  carMode: boolean;
  colors: ReturnType<typeof useApp>["colors"];
  onLayout: (e: any) => void;
}) {
  const opacity = useSharedValue(active ? 1 : 0.35);
  const scale = useSharedValue(active ? 1 : 0.96);

  useEffect(() => {
    opacity.value = withTiming(active ? 1 : 0.35, { duration: 300 });
    scale.value = withTiming(active ? 1 : 0.96, { duration: 300 });
  }, [active, opacity, scale]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const isEmpty = !line.original?.trim() && !line.translated?.trim();
  if (isEmpty) {
    return <View style={{ height: 24 }} onLayout={onLayout} />;
  }

  const baseSize = carMode ? (active ? 40 : 24) : (active ? 24 : 18);
  const transSize = carMode ? (active ? 32 : 20) : (active ? 18 : 14);
  const color = active ? colors.textPrimary : colors.textSecondary;
  const transColor = active ? colors.primary : colors.textMuted;

  return (
    <Animated.View style={[styles.line, animStyle]} onLayout={onLayout}>
      {(mode === "original" || mode === "both") && line.original ? (
        <Text
          style={[
            styles.originalText,
            {
              color,
              fontSize: baseSize,
              fontWeight: active ? "800" : "600",
            },
          ]}
        >
          {line.original}
        </Text>
      ) : null}
      {(mode === "translation" || mode === "both") && line.translated ? (
        <Text
          style={[
            styles.translationText,
            {
              color: transColor,
              fontSize: mode === "translation" ? baseSize : transSize,
              fontWeight: active ? "700" : "500",
            },
          ]}
        >
          {line.translated}
        </Text>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 24,
  },
  line: {
    marginBottom: 18,
    alignItems: "flex-start",
  },
  originalText: {
    letterSpacing: -0.3,
    lineHeight: undefined,
  },
  translationText: {
    marginTop: 6,
    fontStyle: "italic",
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
  },
});
