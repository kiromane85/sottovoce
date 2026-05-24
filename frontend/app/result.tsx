import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useApp } from "@/src/context/AppContext";
import TrackCard from "@/src/components/TrackCard";
import KaraokeViewer, { ViewMode } from "@/src/components/KaraokeViewer";
import { trackStore } from "@/src/lib/trackStore";
import { TrackResolveResponse } from "@/src/lib/types";

const SPEEDS = [0.75, 1, 1.25];

function formatTime(ms: number): string {
  if (!isFinite(ms) || ms < 0) ms = 0;
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function ResultScreen() {
  const { colors, isDark } = useApp();
  const router = useRouter();
  const [track] = useState<TrackResolveResponse | null>(() => trackStore.get());
  const [mode, setMode] = useState<ViewMode>("both");
  const [carMode, setCarMode] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [speedIdx, setSpeedIdx] = useState(1);
  const [offsetMs, setOffsetMs] = useState(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTickRef = useRef<number>(0);

  const durationMs = useMemo(() => {
    if (!track) return 0;
    if (track.duration) return Math.round(track.duration * 1000);
    const maxT = track.lines.reduce((acc, l) => (l.t_ms && l.t_ms > acc ? l.t_ms : acc), 0);
    return maxT + 8000;
  }, [track]);

  useEffect(() => {
    if (!playing) {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
      return;
    }
    lastTickRef.current = Date.now();
    tickRef.current = setInterval(() => {
      const now = Date.now();
      const delta = (now - lastTickRef.current) * SPEEDS[speedIdx];
      lastTickRef.current = now;
      setPositionMs((p) => {
        const next = p + delta;
        if (durationMs > 0 && next >= durationMs) {
          setPlaying(false);
          return durationMs;
        }
        return next;
      });
    }, 100);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [playing, speedIdx, durationMs]);

  const togglePlay = () => {
    if (positionMs >= durationMs && durationMs > 0) {
      setPositionMs(0);
    }
    setPlaying((p) => !p);
  };

  const reset = () => {
    setPlaying(false);
    setPositionMs(0);
  };

  if (!track) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.emptyWrap}>
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
            Nessun brano caricato
          </Text>
          <Pressable
            testID="result-back-home-btn"
            onPress={() => router.replace("/")}
            style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.primaryBtnText}>Torna alla home</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const noLyrics = !track.lines.length;
  const lowConfidence = track.source === "recognition" && track.confidence < 0.4;

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: carMode ? "#000000" : colors.background }]}
      edges={["top", "bottom"]}
    >
      {!carMode ? (
        <View style={styles.header}>
          <Pressable
            testID="result-back-btn"
            onPress={() => router.replace("/")}
            style={[styles.headerBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Risultato</Text>
          <Pressable
            testID="result-car-toggle-btn"
            onPress={() => setCarMode(true)}
            style={[styles.headerBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Ionicons name="car-sport-outline" size={22} color={colors.textPrimary} />
          </Pressable>
        </View>
      ) : (
        <View style={styles.carHeader}>
          <Pressable
            testID="result-exit-car-btn"
            onPress={() => setCarMode(false)}
            style={[styles.carExitBtn]}
          >
            <Ionicons name="contract-outline" size={28} color="#FFFFFF" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.carTrackTitle} numberOfLines={1}>{track.title}</Text>
            <Text style={styles.carTrackArtist} numberOfLines={1}>{track.artist}</Text>
          </View>
        </View>
      )}

      {!carMode ? (
        <ScrollView style={{ maxHeight: 220 }} contentContainerStyle={{ padding: 20 }}>
          <TrackCard
            testID="result-track-card"
            title={track.title}
            artist={track.artist}
            album={track.album}
            confidence={track.confidence}
            source={track.source}
          />
          {lowConfidence ? (
            <View style={[styles.warnBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="warning-outline" size={18} color={colors.error} />
              <Text style={[styles.warnText, { color: colors.textSecondary }]}>
                Riconoscimento incerto. Prova ad inserire il brano manualmente.
              </Text>
            </View>
          ) : null}
          {noLyrics ? (
            <View style={[styles.warnBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="information-circle-outline" size={18} color={colors.textSecondary} />
              <Text style={[styles.warnText, { color: colors.textSecondary }]}>
                Nessun testo trovato per questo brano.
              </Text>
            </View>
          ) : null}
        </ScrollView>
      ) : null}

      {!carMode && !noLyrics ? (
        <View style={[styles.tabs, { backgroundColor: colors.surfaceHighlight }]}>
          {(["original", "both", "translation"] as ViewMode[]).map((m) => {
            const active = mode === m;
            const label = m === "original" ? "Originale" : m === "both" ? "Entrambi" : "Traduzione";
            return (
              <Pressable
                key={m}
                testID={`result-tab-${m}`}
                onPress={() => setMode(m)}
                style={[
                  styles.tab,
                  {
                    backgroundColor: active ? colors.surface : "transparent",
                  },
                ]}
              >
                <Text
                  style={{
                    color: active ? colors.primary : colors.textSecondary,
                    fontWeight: active ? "700" : "500",
                    fontSize: 13,
                  }}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <View style={{ flex: 1 }}>
        <KaraokeViewer
          lines={track.lines}
          hasSynced={track.has_synced}
          positionMs={positionMs + offsetMs}
          mode={carMode ? "both" : mode}
          carMode={carMode}
        />
      </View>

      {!noLyrics && track.has_synced ? (
        <View
          style={[
            styles.controls,
            {
              backgroundColor: carMode ? "#000000" : colors.surface,
              borderTopColor: carMode ? "#222" : colors.border,
            },
          ]}
        >
          <View style={styles.timeRow}>
            <Text style={[styles.timeText, { color: carMode ? "#FFFFFF" : colors.textSecondary }]}>
              {formatTime(positionMs)}
            </Text>
            <View
              style={[
                styles.progressTrack,
                { backgroundColor: carMode ? "#222" : colors.surfaceHighlight },
              ]}
            >
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: colors.primary,
                    width: `${Math.min(100, durationMs ? (positionMs / durationMs) * 100 : 0)}%`,
                  },
                ]}
              />
            </View>
            <Text style={[styles.timeText, { color: carMode ? "#FFFFFF" : colors.textSecondary }]}>
              {formatTime(durationMs)}
            </Text>
          </View>

          <View style={styles.controlRow}>
            <Pressable
              testID="result-offset-minus"
              onPress={() => setOffsetMs((o) => o - 500)}
              style={[styles.smallBtn, { borderColor: carMode ? "#444" : colors.border }]}
            >
              <Text style={{ color: carMode ? "#FFFFFF" : colors.textPrimary, fontWeight: "700" }}>−0.5s</Text>
            </Pressable>

            <Pressable
              testID="result-reset-btn"
              onPress={reset}
              style={[styles.smallBtn, { borderColor: carMode ? "#444" : colors.border }]}
            >
              <Ionicons name="refresh" size={20} color={carMode ? "#FFFFFF" : colors.textPrimary} />
            </Pressable>

            <Pressable
              testID="result-play-btn"
              onPress={togglePlay}
              style={[styles.playBtn, { backgroundColor: colors.primary }]}
            >
              <Ionicons
                name={playing ? "pause" : "play"}
                size={28}
                color="#FFFFFF"
                style={!playing ? { marginLeft: 2 } : undefined}
              />
            </Pressable>

            <Pressable
              testID="result-speed-btn"
              onPress={() => setSpeedIdx((i) => (i + 1) % SPEEDS.length)}
              style={[styles.smallBtn, { borderColor: carMode ? "#444" : colors.border }]}
            >
              <Text style={{ color: carMode ? "#FFFFFF" : colors.textPrimary, fontWeight: "700" }}>
                {SPEEDS[speedIdx]}x
              </Text>
            </Pressable>

            <Pressable
              testID="result-offset-plus"
              onPress={() => setOffsetMs((o) => o + 500)}
              style={[styles.smallBtn, { borderColor: carMode ? "#444" : colors.border }]}
            >
              <Text style={{ color: carMode ? "#FFFFFF" : colors.textPrimary, fontWeight: "700" }}>+0.5s</Text>
            </Pressable>
          </View>

          {offsetMs !== 0 ? (
            <Text style={[styles.offsetHint, { color: carMode ? "#888" : colors.textMuted }]}>
              Offset: {(offsetMs / 1000).toFixed(1)}s
            </Text>
          ) : null}
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  carHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 16,
  },
  carExitBtn: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#1a1a1a",
    alignItems: "center",
    justifyContent: "center",
  },
  carTrackTitle: { color: "#FFFFFF", fontSize: 22, fontWeight: "800" },
  carTrackArtist: { color: "#999999", fontSize: 16, fontWeight: "500" },
  warnBox: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  warnText: { flex: 1, fontSize: 13 },
  tabs: {
    flexDirection: "row",
    marginHorizontal: 20,
    padding: 4,
    borderRadius: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  controls: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: 1,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  timeText: { fontSize: 12, fontWeight: "600", minWidth: 36 },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: { height: "100%" },
  controlRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  smallBtn: {
    minWidth: 56,
    minHeight: 44,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  playBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  offsetHint: { marginTop: 8, textAlign: "center", fontSize: 11 },
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 16 },
  emptyTitle: { fontSize: 20, fontWeight: "700" },
  primaryBtn: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 999,
    minHeight: 48,
    justifyContent: "center",
  },
  primaryBtnText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
});
