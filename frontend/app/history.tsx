import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@/src/components/Ionicons";

import { useApp } from "@/src/context/AppContext";
import {
  clearHistory,
  deleteHistoryItem,
  fetchHistory,
  fetchHistoryItem,
} from "@/src/lib/api";
import { HistoryItem } from "@/src/lib/types";
import { trackStore } from "@/src/lib/trackStore";

function relTime(iso: string): string {
  try {
    const d = new Date(iso);
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60) return "ora";
    if (diff < 3600) return `${Math.floor(diff / 60)} min fa`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} h fa`;
    return d.toLocaleDateString();
  } catch {
    return "";
  }
}

export default function HistoryScreen() {
  const { colors } = useApp();
  const router = useRouter();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchHistory();
      setItems(data);
      setError(null);
    } catch (e: any) {
      setError(e?.message || "Errore");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const openItem = async (id: string) => {
    try {
      const track = await fetchHistoryItem(id);
      trackStore.set(track);
      router.push("/result");
    } catch (e: any) {
      Alert.alert("Errore", e?.message || "Impossibile aprire il brano");
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert("Elimina brano", "Vuoi eliminare questo brano dalla cronologia?", [
      { text: "Annulla", style: "cancel" },
      {
        text: "Elimina",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteHistoryItem(id);
            setItems((curr) => curr.filter((x) => x.id !== id));
          } catch (e: any) {
            Alert.alert("Errore", e?.message || "Impossibile eliminare");
          }
        },
      },
    ]);
  };

  const handleClearAll = () => {
    Alert.alert("Svuota cronologia", "Vuoi cancellare tutti i brani?", [
      { text: "Annulla", style: "cancel" },
      {
        text: "Svuota",
        style: "destructive",
        onPress: async () => {
          try {
            await clearHistory();
            setItems([]);
          } catch (e: any) {
            Alert.alert("Errore", e?.message || "Impossibile svuotare");
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable
          testID="history-back-btn"
          onPress={() => router.back()}
          style={[styles.headerBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Cronologia</Text>
        {items.length ? (
          <Pressable
            testID="history-clear-all-btn"
            onPress={handleClearAll}
            style={[styles.headerBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Ionicons name="trash-outline" size={20} color={colors.error} />
          </Pressable>
        ) : (
          <View style={{ width: 44 }} />
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={{ color: colors.error }}>{error}</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="albums-outline" size={48} color={colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
            Nessun brano ancora
          </Text>
          <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
            I brani riconosciuti appariranno qui.
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20, gap: 10 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => (
            <Pressable
              testID={`history-item-${item.id}`}
              onPress={() => openItem(item.id)}
              onLongPress={() => handleDelete(item.id)}
              style={({ pressed }) => [
                styles.row,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <View style={[styles.thumb, { backgroundColor: colors.surfaceHighlight }]}>
                <Ionicons name="musical-note" size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={[styles.rowTitle, { color: colors.textPrimary }]}>
                  {item.title || "Brano sconosciuto"}
                </Text>
                <Text numberOfLines={1} style={[styles.rowSub, { color: colors.textSecondary }]}>
                  {item.artist || "Artista sconosciuto"} • {item.target_lang}
                </Text>
                <Text style={[styles.rowMeta, { color: colors.textMuted }]}>
                  {relTime(item.created_at)} • {item.has_synced ? "Sincronizzato" : "Testo semplice"}
                </Text>
              </View>
              <Pressable
                testID={`history-delete-${item.id}`}
                hitSlop={10}
                onPress={() => handleDelete(item.id)}
                style={styles.delBtn}
              >
                <Ionicons name="close" size={18} color={colors.textMuted} />
              </Pressable>
            </Pressable>
          )}
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
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8, padding: 24 },
  emptyTitle: { fontSize: 18, fontWeight: "700", marginTop: 12 },
  emptySub: { fontSize: 14, textAlign: "center" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: { fontSize: 15, fontWeight: "700" },
  rowSub: { fontSize: 13, marginTop: 2 },
  rowMeta: { fontSize: 11, marginTop: 4 },
  delBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
