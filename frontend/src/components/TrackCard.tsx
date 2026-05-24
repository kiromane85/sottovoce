import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@/src/components/Ionicons";

import { useApp } from "@/src/context/AppContext";

type Props = {
  title: string;
  artist: string;
  album?: string | null;
  confidence?: number;
  source?: "recognition" | "manual";
  testID?: string;
};

export default function TrackCard({ title, artist, album, confidence = 0, source = "recognition", testID }: Props) {
  const { colors } = useApp();

  return (
    <View
      testID={testID}
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={[styles.artwork, { backgroundColor: colors.surfaceHighlight }]}>
        <Ionicons name="musical-notes" size={36} color={colors.primary} />
      </View>
      <View style={styles.info}>
        <Text
          numberOfLines={2}
          style={[styles.title, { color: colors.textPrimary }]}
          testID="track-title"
        >
          {title || "Brano sconosciuto"}
        </Text>
        <Text numberOfLines={1} style={[styles.artist, { color: colors.textSecondary }]} testID="track-artist">
          {artist || "Artista sconosciuto"}
        </Text>
        {album ? (
          <Text numberOfLines={1} style={[styles.album, { color: colors.textMuted }]}>
            {album}
          </Text>
        ) : null}
        <View style={styles.meta}>
          <View style={[styles.badge, { backgroundColor: colors.surfaceHighlight }]}>
            <Ionicons
              name={source === "manual" ? "create-outline" : "sparkles-outline"}
              size={12}
              color={colors.textSecondary}
            />
            <Text style={[styles.badgeText, { color: colors.textSecondary }]}>
              {source === "manual" ? "Manuale" : `${Math.round(confidence * 100)}% match`}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    gap: 16,
    borderWidth: 1,
  },
  artwork: {
    width: 72,
    height: 72,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  artist: {
    fontSize: 14,
    fontWeight: "500",
  },
  album: {
    fontSize: 12,
  },
  meta: {
    marginTop: 6,
    flexDirection: "row",
    gap: 8,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
});
