import { Link } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { BeanSession, ShotRecord } from "../../domain/types";
import { repository } from "../repository";
import { colors, spacing } from "../theme";

export function SessionDetailScreen({ sessionId }: { sessionId?: string }) {
  const [session, setSession] = useState<BeanSession | null>(null);
  const [shots, setShots] = useState<ShotRecord[]>([]);

  useEffect(() => {
    if (!sessionId) {
      return;
    }
    void Promise.all([
      repository.getSession(sessionId),
      repository.listShots(sessionId),
    ]).then(([nextSession, nextShots]) => {
      setSession(nextSession ?? null);
      setShots(nextShots);
    });
  }, [sessionId]);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={styles.screen}
      contentContainerStyle={styles.content}
    >
      <View style={styles.card}>
        <Text selectable style={styles.title}>
          {session?.name ?? "세션 기록"}
        </Text>
        <Text selectable style={styles.mutedText}>
          {shots.length} shots
        </Text>
      </View>

      {shots.map((shot) => (
        <Link
          href={{ pathname: "/shot/[shotId]", params: { shotId: shot.id } }}
          asChild
          key={shot.id}
        >
          <Pressable style={styles.shotCard}>
            <Text selectable style={styles.shotTitle}>
              Shot {String(shot.shotNumber).padStart(2, "0")}
            </Text>
            <Text selectable style={styles.bodyText}>
              {shot.extraction.tasteDescription}
            </Text>
            <Text selectable style={styles.mutedText}>
              1:{shot.extraction.brewRatio.toFixed(1)} ·{" "}
              {shot.extraction.brewSeconds}s ·{" "}
              {shot.recommendation.primary.message}
            </Text>
          </Pressable>
        </Link>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    gap: spacing.md,
    padding: spacing.lg,
  },
  card: {
    gap: spacing.xs,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    padding: spacing.lg,
    backgroundColor: colors.surface,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900",
  },
  shotCard: {
    gap: spacing.xs,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    padding: spacing.lg,
    backgroundColor: colors.surface,
  },
  shotTitle: {
    color: colors.text,
    fontWeight: "900",
  },
  bodyText: {
    color: colors.text,
    lineHeight: 22,
  },
  mutedText: {
    color: colors.muted,
  },
});
