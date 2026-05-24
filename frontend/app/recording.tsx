import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@/src/components/Ionicons";
import {
  RecordingPresets,
  getRecordingPermissionsAsync,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { useApp } from "@/src/context/AppContext";
import MicButton from "@/src/components/MicButton";
import { resolveAudio } from "@/src/lib/api";
import { trackStore } from "@/src/lib/trackStore";

const RECORD_DURATION_MS = 30000;

type Phase = "idle" | "permission" | "denied" | "recording" | "uploading" | "error";

export default function RecordingScreen() {
  const { colors, targetLang } = useApp();
  const router = useRouter();

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);

  const [phase, setPhase] = useState<Phase>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [canAskAgain, setCanAskAgain] = useState(true);
  const stopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progress = useSharedValue(0);

  useEffect(() => {
    // Configure audio mode for recording on iOS
    setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true }).catch(() => {});
  }, []);

  const start = async () => {
    setErrorMsg(null);
    setPhase("permission");
    try {
      let perm = await getRecordingPermissionsAsync();
      if (perm.status !== "granted") {
        if (!perm.canAskAgain) {
          setCanAskAgain(false);
          setPhase("denied");
          return;
        }
        perm = await requestRecordingPermissionsAsync();
        setCanAskAgain(perm.canAskAgain);
        if (perm.status !== "granted") {
          setPhase("denied");
          return;
        }
      }

      await recorder.prepareToRecordAsync();
      recorder.record();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      setPhase("recording");

      progress.value = 0;
      progress.value = withTiming(1, {
        duration: RECORD_DURATION_MS,
        easing: Easing.linear,
      });

      stopTimer.current = setTimeout(() => {
        finish().catch((e) => {
          setErrorMsg(String(e));
          setPhase("error");
        });
      }, RECORD_DURATION_MS);
    } catch (e: any) {
      setErrorMsg(e?.message || String(e));
      setPhase("error");
    }
  };

  const finish = async () => {
    if (stopTimer.current) {
      clearTimeout(stopTimer.current);
      stopTimer.current = null;
    }
    setPhase("uploading");
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) throw new Error("Registrazione vuota");
      const mime = Platform.OS === "web" ? "audio/webm" : "audio/m4a";
      const track = await resolveAudio(uri, mime, targetLang);
      trackStore.set(track);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      router.replace("/result");
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      setErrorMsg(e?.message || String(e));
      setPhase("error");
    }
  };

  const cancel = async () => {
    if (stopTimer.current) {
      clearTimeout(stopTimer.current);
      stopTimer.current = null;
    }
    try {
      if (recorderState.isRecording) {
        await recorder.stop();
      }
    } catch {}
    router.back();
  };

  useEffect(() => {
    // Auto-start when the screen mounts
    start();
    return () => {
      if (stopTimer.current) clearTimeout(stopTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const isBusy = phase === "uploading";
  const isRecording = phase === "recording";

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable
          testID="recording-cancel-btn"
          onPress={cancel}
          style={[styles.headerBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Ionicons name="close" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Ascolto</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.center}>
        {phase === "denied" ? (
          <View style={styles.deniedWrap}>
            <Ionicons name="mic-off-outline" size={48} color={colors.error} />
            <Text style={[styles.title, { color: colors.textPrimary, marginTop: 16 }]}>
              Permesso microfono negato
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Sottovoce ha bisogno del microfono per riconoscere il brano in riproduzione.
            </Text>
            <Pressable
              testID="recording-open-settings-btn"
              onPress={() => Linking.openSettings()}
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.primaryBtnText}>Apri impostazioni</Text>
            </Pressable>
            {canAskAgain ? (
              <Pressable
                onPress={start}
                style={({ pressed }) => [
                  styles.secondaryBtn,
                  { borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Text style={[styles.secondaryBtnText, { color: colors.textPrimary }]}>
                  Riprova
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : phase === "error" ? (
          <View style={styles.deniedWrap}>
            <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
            <Text style={[styles.title, { color: colors.textPrimary, marginTop: 16 }]}>
              Si è verificato un errore
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {errorMsg || "Riprova tra qualche secondo."}
            </Text>
            <Pressable
              testID="recording-retry-btn"
              onPress={start}
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.primaryBtnText}>Riprova</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <Text style={[styles.kicker, { color: colors.textSecondary }]}>
              {isBusy ? "ANALISI IN CORSO" : isRecording ? "ASCOLTO IN CORSO" : "PREPARAZIONE"}
            </Text>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              {isBusy ? "Sto riconoscendo il brano" : isRecording ? "Avvicina il telefono" : "Attiva microfono"}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {isBusy
                ? "Sto cercando i testi e la traduzione..."
                : "Tieni il telefono vicino alla fonte audio per ~30 secondi."}
            </Text>

            <View style={{ height: 56 }} />

            {isBusy ? (
              <ActivityIndicator color={colors.primary} size="large" />
            ) : (
              <MicButton
                testID="recording-stop-btn"
                recording={isRecording}
                onPress={() => {
                  if (isRecording) {
                    finish().catch((e) => {
                      setErrorMsg(String(e));
                      setPhase("error");
                    });
                  }
                }}
              />
            )}

            {isRecording ? (
              <View style={[styles.progressTrack, { backgroundColor: colors.surfaceHighlight }]}>
                <Animated.View
                  style={[styles.progressFill, { backgroundColor: colors.primary }, progressStyle]}
                />
              </View>
            ) : null}
          </>
        )}
      </View>
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
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  kicker: { fontSize: 12, fontWeight: "700", letterSpacing: 2, marginBottom: 12 },
  title: { fontSize: 28, fontWeight: "800", letterSpacing: -0.5, textAlign: "center" },
  subtitle: { fontSize: 15, marginTop: 12, textAlign: "center", maxWidth: 320, lineHeight: 22 },
  deniedWrap: { alignItems: "center", paddingHorizontal: 8 },
  progressTrack: {
    marginTop: 48,
    width: 260,
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
  },
  primaryBtn: {
    marginTop: 28,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 999,
    minHeight: 48,
    justifyContent: "center",
  },
  primaryBtnText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  secondaryBtn: {
    marginTop: 12,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 999,
    borderWidth: 1,
  },
  secondaryBtnText: { fontSize: 15, fontWeight: "600" },
});
