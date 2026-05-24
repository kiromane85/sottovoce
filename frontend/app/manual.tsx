import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useApp } from "@/src/context/AppContext";
import { resolveManual } from "@/src/lib/api";
import { trackStore } from "@/src/lib/trackStore";

export default function ManualScreen() {
  const { colors, targetLang } = useApp();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!title.trim() || !artist.trim()) {
      setError("Inserisci sia titolo che artista.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const track = await resolveManual(title.trim(), artist.trim(), targetLang);
      trackStore.set(track);
      router.replace("/result");
    } catch (e: any) {
      setError(e?.message || "Errore durante il recupero del testo.");
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <Pressable
            testID="manual-back-btn"
            onPress={() => router.back()}
            style={[styles.headerBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Inserisci brano</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.body}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Cerca per titolo e artista
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Usa questa modalità quando il riconoscimento automatico non funziona.
          </Text>

          <View style={{ height: 24 }} />

          <Text style={[styles.label, { color: colors.textSecondary }]}>Titolo</Text>
          <TextInput
            testID="manual-title-input"
            value={title}
            onChangeText={setTitle}
            placeholder="Es. Bohemian Rhapsody"
            placeholderTextColor={colors.textMuted}
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                color: colors.textPrimary,
                borderColor: colors.border,
              },
            ]}
          />

          <Text style={[styles.label, { color: colors.textSecondary, marginTop: 16 }]}>Artista</Text>
          <TextInput
            testID="manual-artist-input"
            value={artist}
            onChangeText={setArtist}
            placeholder="Es. Queen"
            placeholderTextColor={colors.textMuted}
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                color: colors.textPrimary,
                borderColor: colors.border,
              },
            ]}
          />

          {error ? (
            <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
          ) : null}
        </View>

        <View style={styles.footer}>
          <Pressable
            testID="manual-submit-btn"
            onPress={submit}
            disabled={loading}
            style={({ pressed }) => [
              styles.primaryBtn,
              {
                backgroundColor: colors.primary,
                opacity: pressed || loading ? 0.7 : 1,
              },
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryBtnText}>Cerca e traduci</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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
  body: { flex: 1, paddingHorizontal: 24, paddingTop: 24 },
  title: { fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
  subtitle: { fontSize: 14, marginTop: 8, lineHeight: 20 },
  label: { fontSize: 12, fontWeight: "700", letterSpacing: 1, marginBottom: 6 },
  input: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  error: { marginTop: 16, fontSize: 13, fontWeight: "600" },
  footer: { paddingHorizontal: 24, paddingBottom: 16 },
  primaryBtn: {
    minHeight: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
});
