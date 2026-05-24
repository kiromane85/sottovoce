import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@/src/components/Ionicons";

import { useApp } from "@/src/context/AppContext";
import { resolveLinkMeta, resolveManual } from "@/src/lib/api";
import { trackStore } from "@/src/lib/trackStore";

export default function ManualScreen() {
  const { colors, targetLang } = useApp();
  const router = useRouter();
  const params = useLocalSearchParams<{ link?: string; auto?: string }>();
  const initialLink = (params.link as string) || "";
  const autoResolve = params.auto === "1";

  const [link, setLink] = useState(initialLink);
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkInfo, setLinkInfo] = useState<string | null>(null);
  const autoTriggered = useRef(false);

  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolveLink = async () => {
    const url = link.trim();
    if (!url) {
      setError("Incolla un link Tidal, Spotify, Apple Music o YouTube Music.");
      return;
    }
    setError(null);
    setLinkInfo(null);
    setLinkLoading(true);
    try {
      const meta = await resolveLinkMeta(url, targetLang);
      if (meta.title) setTitle(meta.title);
      if (meta.artist) setArtist(meta.artist);
      if (!meta.artist) {
        setLinkInfo(
          "Ho trovato solo il titolo. Aggiungi l'artista manualmente e tocca cerca."
        );
      } else {
        setLinkInfo(`Pre-compilato da ${meta.source || "link"}.`);
      }
    } catch (e: any) {
      setError(
        e?.message?.includes("404")
          ? "Brano non trovato dal link. Controlla l'URL o inserisci titolo e artista manualmente."
          : e?.message || "Errore nel risolvere il link."
      );
    } finally {
      setLinkLoading(false);
    }
  };

  // Auto-trigger link resolution when arriving from a Share intent
  useEffect(() => {
    if (autoResolve && initialLink && !autoTriggered.current) {
      autoTriggered.current = true;
      resolveLink();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoResolve, initialLink]);

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

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Da link o manualmente
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Incolla un link da Spotify, Tidal, Apple Music o YouTube Music — oppure inserisci titolo e artista.
          </Text>

          <View style={{ height: 24 }} />

          <Text style={[styles.label, { color: colors.textSecondary }]}>Link al brano</Text>
          <View style={styles.linkRow}>
            <TextInput
              testID="manual-link-input"
              value={link}
              onChangeText={setLink}
              placeholder="https://open.spotify.com/track/…"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              style={[
                styles.input,
                styles.linkInput,
                {
                  backgroundColor: colors.surface,
                  color: colors.textPrimary,
                  borderColor: colors.border,
                },
              ]}
            />
            <Pressable
              testID="manual-resolve-link-btn"
              onPress={resolveLink}
              disabled={linkLoading}
              style={({ pressed }) => [
                styles.linkBtn,
                {
                  backgroundColor: colors.primary,
                  opacity: pressed || linkLoading ? 0.7 : 1,
                },
              ]}
            >
              {linkLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Ionicons name="arrow-down-circle" size={22} color="#FFFFFF" />
              )}
            </Pressable>
          </View>
          {linkInfo ? (
            <Text style={[styles.info, { color: colors.success }]}>{linkInfo}</Text>
          ) : null}

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

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
        </ScrollView>

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
  body: { padding: 24, paddingBottom: 32 },
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
  linkRow: { flexDirection: "row", gap: 8 },
  linkInput: { flex: 1 },
  linkBtn: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  info: { marginTop: 8, fontSize: 12, fontWeight: "600" },
  divider: { height: 1, marginVertical: 20 },
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
