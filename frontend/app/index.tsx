import React, { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useApp } from "@/src/context/AppContext";
import MicButton from "@/src/components/MicButton";

export default function Home() {
  const { colors, targetLang, hasOnboarded } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!hasOnboarded) {
      router.replace("/language?initial=1");
    }
  }, [hasOnboarded, router]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top", "bottom"]}>
      <View style={styles.topRow}>
        <View style={styles.brand}>
          <View style={[styles.dot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.brandText, { color: colors.textPrimary }]}>
            Sottovoce
          </Text>
        </View>
        <View style={styles.iconRow}>
          <Pressable
            testID="home-history-btn"
            onPress={() => router.push("/history")}
            style={({ pressed }) => [
              styles.iconBtn,
              { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Ionicons name="time-outline" size={22} color={colors.textPrimary} />
          </Pressable>
          <Pressable
            testID="home-settings-btn"
            onPress={() => router.push("/settings")}
            style={({ pressed }) => [
              styles.iconBtn,
              { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Ionicons name="settings-outline" size={22} color={colors.textPrimary} />
          </Pressable>
        </View>
      </View>

      <View style={styles.centerWrap}>
        <Text style={[styles.kicker, { color: colors.textSecondary }]}>BENVENUTO</Text>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Riconosci e traduci
        </Text>
        <Text style={[styles.title, { color: colors.primary }]}>la tua musica</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Tocca il microfono e ascolto la canzone per ~9 secondi.
        </Text>

        <View style={{ height: 56 }} />

        <MicButton
          testID="home-mic-btn"
          recording={false}
          onPress={() => router.push("/recording")}
        />

        <Pressable
          testID="home-manual-btn"
          onPress={() => router.push("/manual")}
          style={({ pressed }) => [
            styles.manualBtn,
            { borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Ionicons name="create-outline" size={18} color={colors.textPrimary} />
          <Text style={[styles.manualText, { color: colors.textPrimary }]}>
            Inserisci manualmente
          </Text>
        </Pressable>
      </View>

      <Pressable
        testID="home-lang-pill"
        onPress={() => router.push("/language")}
        style={({ pressed }) => [
          styles.langPill,
          { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
        ]}
      >
        <Ionicons name="globe-outline" size={16} color={colors.textSecondary} />
        <Text style={[styles.langPillText, { color: colors.textSecondary }]}>
          Traduzione in {targetLang}
        </Text>
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  brand: { flexDirection: "row", alignItems: "center", gap: 10 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  brandText: { fontSize: 18, fontWeight: "800", letterSpacing: -0.3 },
  iconRow: { flexDirection: "row", gap: 8 },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  centerWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  kicker: { fontSize: 12, fontWeight: "700", letterSpacing: 2, marginBottom: 12 },
  title: { fontSize: 36, fontWeight: "800", letterSpacing: -1, lineHeight: 42, textAlign: "center" },
  subtitle: { fontSize: 15, marginTop: 16, textAlign: "center", lineHeight: 22, maxWidth: 320 },
  manualBtn: {
    marginTop: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 999,
    borderWidth: 1,
  },
  manualText: { fontSize: 15, fontWeight: "600" },
  langPill: {
    marginHorizontal: 20,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
  langPillText: { fontSize: 14, fontWeight: "600" },
});
