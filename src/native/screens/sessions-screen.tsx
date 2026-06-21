import { Link } from "expo-router";
import { ChevronRight, ClipboardList, Coffee, History } from "lucide-react-native";
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
      <View style={styles.headerRow}>
        <View style={styles.headerIcon}>
          <ClipboardList color={colors.accent} size={18} strokeWidth={2} />
        </View>
        <Text selectable style={styles.kicker}>
          세션
        </Text>
      </View>
      {sessions.length === 0 ? (
        <View style={styles.emptyPanel}>
          <Text selectable style={styles.emptyText}>
            아직 저장된 세션이 없습니다.
          </Text>
          <Link href="/" asChild>
            <Pressable style={styles.primaryButton}>
              <Coffee color={colors.textInverse} size={18} strokeWidth={2.1} />
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
                <View style={styles.sessionPill}>
                  <History color={colors.textInverse} size={12} strokeWidth={2} />
                  <Text selectable style={styles.sessionPillText}>
                    {formatSessionStatus(session.status)}
                  </Text>
                </View>
                <Text selectable style={styles.title}>
                  {session.name}
                </Text>
                <Text selectable style={styles.mutedText}>
                  최근 업데이트 {session.updatedAt.slice(0, 10)}
                </Text>
              </View>
              <View style={styles.rowAction}>
                <ChevronRight color={colors.muted} size={18} strokeWidth={2} />
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  headerIcon: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    backgroundColor: colors.backgroundAlt,
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
  rowAction: {
    alignItems: "center",
    justifyContent: "center",
    paddingRight: spacing.md,
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
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    overflow: "hidden",
    borderRadius: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: colors.inkSoft,
  },
  sessionPillText: {
    ...typography.strongMeta,
    color: colors.textInverse,
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
    flexDirection: "row",
    gap: spacing.sm,
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
