import { Link } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import type { BeanSession } from "../../domain/types";
import { repository } from "../repository";
import { colors, spacing } from "../theme";

export function SessionsScreen() {
  const [sessions, setSessions] = useState<BeanSession[]>([]);

  useEffect(() => {
    void repository.listSessions().then(setSessions);
  }, []);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={styles.screen}
      contentContainerStyle={styles.content}
    >
      {sessions.length === 0 ? (
        <Text selectable style={styles.mutedText}>
          저장된 세션이 없습니다.
        </Text>
      ) : (
        sessions.map((session) => (
          <Link
            href={{
              pathname: "/session/[sessionId]",
              params: { sessionId: session.id },
            }}
            asChild
            key={session.id}
          >
            <Pressable style={styles.card}>
              <Text selectable style={styles.title}>
                {session.name}
              </Text>
              <Text selectable style={styles.mutedText}>
                {session.status} · {session.updatedAt.slice(0, 10)}
              </Text>
            </Pressable>
          </Link>
        ))
      )}
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
    fontSize: 18,
    fontWeight: "900",
  },
  mutedText: {
    color: colors.muted,
  },
});
