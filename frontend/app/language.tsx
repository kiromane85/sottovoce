import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useApp } from "@/src/context/AppContext";
import { fetchLanguages } from "@/src/lib/api";
import { Language } from "@/src/lib/types";

export default function LanguageScreen() {
  const { colors, targetLang, setTargetLang, setHasOnboarded } = useApp();
  const router = useRouter();
  const { initial } = useLocalSearchParams<{ initial?: string }>();
  const isInitial = initial === "1";

  const [langs, setLangs] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    fetchLanguages()
      .then((l) => {
        if (mounted) {
          setLangs(l);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (mounted) {
          setError(String(e));
          setLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handlePick = (code: string) => {
    setTargetLang(code);
    if (isInitial) {
      setHasOnboarded(true);
      router.replace("/");
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top", "bottom"]}>
      <View style={styles.header}>
        {!isInitial ? (
          <Pressable
            testID="lang-back-btn"
            onPress={() => router.back()}
            style={[styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
          </Pressable>
        ) : (
          <View style={{ width: 44 }} />
        )}
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          {isInitial ? "Benvenuto" : "Lingua"}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.intro}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          {isInitial ? "Scegli la lingua di traduzione" : "Traduci in"}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Potrai cambiarla in qualsiasi momento dalle impostazioni.
        </Text>
      </View>

      {loading ? (
        <View style={styles.centerFlex}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : error ? (
        <View style={styles.centerFlex}>
          <Text style={{ color: colors.error, paddingHorizontal: 24, textAlign: "center" }}>
            Impossibile caricare le lingue. Verifica la connessione.
          </Text>
        </View>
      ) : (
        <FlatList
          data={langs}
          keyExtractor={(item) => item.code}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const active = item.code === targetLang;
            return (
              <Pressable
                testID={`lang-option-${item.code}`}
                onPress={() => handlePick(item.code)}
                style={({ pressed }) => [
                  styles.row,
                  {
                    backgroundColor: active ? colors.primary : colors.surface,
                    borderColor: active ? colors.primary : colors.border,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Text style={{ fontSize: 24, marginRight: 14 }}>{item.flag}</Text>
                <Text
                  style={[
                    styles.rowLabel,
                    { color: active ? "#FFFFFF" : colors.textPrimary },
                  ]}
                >
                  {item.label}
                </Text>
                {active ? (
                  <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
                ) : null}
              </Pressable>
            );
          }}
        />
      )}
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
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  intro: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
  subtitle: { fontSize: 14, marginTop: 8 },
  list: { paddingHorizontal: 20, paddingBottom: 32, gap: 10 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  rowLabel: { flex: 1, fontSize: 16, fontWeight: "600" },
  centerFlex: { flex: 1, alignItems: "center", justifyContent: "center" },
});
