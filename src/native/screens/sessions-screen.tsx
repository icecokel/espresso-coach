import { Link } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { BeanSession } from "../../domain/types";
import { repository } from "../repository";
import {
  layout,
  radius,
  spacing,
  typography,
  useAppTheme,
  type AppColors,
} from "../theme";

export function SessionsScreen() {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
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
      <Text selectable style={styles.kicker}>
        세션
      </Text>
      {sessions.length === 0 ? (
        <View style={styles.emptyPanel}>
          <Text selectable style={styles.emptyText}>
            아직 저장된 세션이 없습니다.
          </Text>
          <Link href="/" asChild>
            <Pressable style={styles.primaryButton}>
              <Text selectable style={styles.primaryButtonText}>
                첫 샷 기록
              </Text>
            </Pressable>
          </Link>
        </View>
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
              {session.status === "active" ? <View style={styles.activeBar} /> : null}
              <View style={styles.cardBody}>
                <Text selectable style={styles.sessionPill}>
                  {formatSessionStatus(session.status)}
                </Text>
                <Text selectable style={styles.title}>
                  {session.name}
                </Text>
                <Text selectable style={styles.mutedText}>
                  최근 업데이트 {session.updatedAt.slice(0, 10)}
                </Text>
              </View>
            </Pressable>
          </Link>
        ))
      )}
    </ScrollView>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    gap: spacing.md,
    padding: layout.screenPadding,
    paddingBottom: layout.scrollBottomPadding,
  },
  kicker: {
    ...typography.strongMeta,
    color: colors.accent,
    textTransform: "uppercase",
  },
  card: {
    minHeight: 76,
    flexDirection: "row",
    overflow: "hidden",
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    backgroundColor: colors.surface,
  },
  activeBar: {
    width: 4,
    backgroundColor: colors.accent,
  },
  cardBody: {
    flex: 1,
    gap: spacing.xs,
    padding: spacing.lg,
  },
  sessionPill: {
    ...typography.strongMeta,
    alignSelf: "flex-start",
    overflow: "hidden",
    borderRadius: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    color: colors.textInverse,
    backgroundColor: colors.inkSoft,
  },
  title: {
    ...typography.sectionTitle,
    color: colors.text,
  },
  emptyPanel: {
    gap: spacing.md,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    padding: spacing.lg,
    backgroundColor: colors.surface,
  },
  emptyText: {
    ...typography.body,
    color: colors.muted,
  },
  primaryButton: {
    minHeight: layout.minTouchSize,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
    backgroundColor: colors.primaryDark,
  },
  primaryButtonText: {
    ...typography.button,
    color: colors.textInverse,
  },
  mutedText: {
    ...typography.meta,
    color: colors.muted,
  },
  });
}

function formatSessionStatus(status: BeanSession["status"]): string {
  return status === "active" ? "진행 중" : "보관됨";
}
