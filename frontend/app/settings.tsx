import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useApp, ThemeMode } from "@/src/context/AppContext";

const THEME_OPTIONS: { mode: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { mode: "light", label: "Chiaro", icon: "sunny-outline" },
  { mode: "dark", label: "Scuro", icon: "moon-outline" },
  { mode: "auto", label: "Automatico", icon: "phone-portrait-outline" },
];

export default function SettingsScreen() {
  const { colors, themeMode, setThemeMode, targetLang } = useApp();
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable
          testID="settings-back-btn"
          onPress={() => router.back()}
          style={[styles.headerBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Impostazioni</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ASPETTO</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {THEME_OPTIONS.map((opt, i) => {
            const active = themeMode === opt.mode;
            return (
              <Pressable
                key={opt.mode}
                testID={`settings-theme-${opt.mode}`}
                onPress={() => setThemeMode(opt.mode)}
                style={({ pressed }) => [
                  styles.row,
                  {
                    borderBottomWidth: i < THEME_OPTIONS.length - 1 ? 1 : 0,
                    borderBottomColor: colors.border,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Ionicons name={opt.icon} size={22} color={colors.textPrimary} />
                <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>{opt.label}</Text>
                {active ? (
                  <Ionicons name="checkmark" size={22} color={colors.primary} />
                ) : null}
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>TRADUZIONE</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Pressable
            testID="settings-language-btn"
            onPress={() => router.push("/language")}
            style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Ionicons name="globe-outline" size={22} color={colors.textPrimary} />
            <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Lingua di traduzione</Text>
            <Text style={[styles.rowValue, { color: colors.textSecondary }]}>{targetLang}</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </Pressable>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>INFORMAZIONI</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.row}>
            <Ionicons name="information-circle-outline" size={22} color={colors.textPrimary} />
            <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Versione</Text>
            <Text style={[styles.rowValue, { color: colors.textSecondary }]}>1.0.0</Text>
          </View>
        </View>

        <Text style={[styles.footer, { color: colors.textMuted }]}>
          Sottovoce riconosce, traduce e mostra in karaoke i testi dei brani che ascolti — anche in auto.
        </Text>
      </ScrollView>
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
  body: { padding: 20, gap: 8 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: 16,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    minHeight: 56,
  },
  rowLabel: { flex: 1, fontSize: 15, fontWeight: "600" },
  rowValue: { fontSize: 14, fontWeight: "500" },
  footer: { marginTop: 32, textAlign: "center", fontSize: 12, lineHeight: 18 },
});
