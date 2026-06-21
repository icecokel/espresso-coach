import { Link } from "expo-router";
import {
  ChevronRight,
  ClipboardList,
  Gauge,
  History,
  Target,
} from "lucide-react-native";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { BeanSession, ShotRecord } from "../../domain/types";
import { repository } from "../repository";
import {
  layout,
  radius,
  spacing,
  typography,
  useAppTheme,
  type AppColors,
} from "../theme";

export function SessionDetailScreen({ sessionId }: { sessionId?: string }) {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
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

  const latestShot = shots[shots.length - 1];

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={styles.screen}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View style={styles.headerIcon}>
            <ClipboardList color={colors.accent} size={18} strokeWidth={2} />
          </View>
          <View>
          <Text selectable style={styles.kicker}>
            세션
          </Text>
          <Text selectable style={styles.title}>
            {session?.name ?? "세션 기록"}
          </Text>
          </View>
        </View>
        <View style={styles.countBadge}>
          <History color={colors.textInverse} size={13} strokeWidth={2} />
          <Text selectable style={styles.countBadgeText}>
            샷 {shots.length}개
          </Text>
        </View>
      </View>

      <View style={styles.summaryStrip}>
        <SummaryItem
          icon={<History color={colors.accent} size={15} strokeWidth={2} />}
          label="최근 샷"
          styles={styles}
          value={latestShot ? `${latestShot.shotNumber}` : "-"}
        />
        <SummaryItem
          icon={<Gauge color={colors.accent} size={15} strokeWidth={2} />}
          label="평균 비율"
          styles={styles}
          value={shots.length ? `1:${averageRatio(shots).toFixed(1)}` : "-"}
        />
        <SummaryItem
          icon={<Target color={colors.accent} size={15} strokeWidth={2} />}
          label="마지막 추천"
          styles={styles}
          value={
            latestShot
              ? formatActionVariable(latestShot.recommendation.primary.variable)
              : "-"
          }
        />
      </View>

      {shots.map((shot) => (
        <Link
          href={{ pathname: "/shot/[shotId]", params: { shotId: shot.id } }}
          asChild
          key={shot.id}
        >
          <Pressable style={styles.shotCard}>
            <View style={styles.shotIndex}>
              <Text selectable style={styles.shotIndexText}>
                {String(shot.shotNumber).padStart(2, "0")}
              </Text>
            </View>
            <View style={styles.shotBody}>
              <Text selectable style={styles.shotTitle}>
                {shot.extraction.tasteDescription}
              </Text>
              <Text selectable style={styles.mutedText}>
                1:{shot.extraction.brewRatio.toFixed(1)} ·{" "}
                {shot.extraction.brewSeconds}s · {shot.extraction.doseGrams}g
                → {shot.extraction.yieldGrams}g
              </Text>
              <Text selectable style={styles.shotAction}>
                {formatActionVariable(shot.recommendation.primary.variable)}
              </Text>
            </View>
            <View style={styles.rowAction}>
              <ChevronRight color={colors.muted} size={18} strokeWidth={2} />
            </View>
          </Pressable>
        </Link>
      ))}
    </ScrollView>
  );
}

function SummaryItem({
  icon,
  label,
  styles,
  value,
}: {
  icon?: ReactNode;
  label: string;
  styles: SessionDetailStyles;
  value: string;
}) {
  return (
    <View style={styles.summaryItem}>
      <View style={styles.summaryIconRow}>
        {icon}
      </View>
      <Text selectable style={styles.summaryValue}>
        {value}
      </Text>
      <Text selectable style={styles.summaryLabel}>
        {label}
      </Text>
    </View>
  );
}

function averageRatio(shots: ShotRecord[]): number {
  return (
    shots.reduce((sum, shot) => sum + shot.extraction.brewRatio, 0) / shots.length
  );
}

function formatActionVariable(variable: string): string {
  const labels: Record<string, string> = {
    grind_size: "분쇄도",
    yield: "추출량",
    dose: "도징량",
    channeling_check: "채널링",
    distribution: "분배",
    tamping_consistency: "탬핑",
    puck_prep: "퍽 준비",
    no_change: "유지",
  };
  return labels[variable] ?? variable;
}

type SessionDetailStyles = ReturnType<typeof createStyles>;

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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  headerTitleRow: {
    flex: 1,
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
  countBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    overflow: "hidden",
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.ink,
  },
  countBadgeText: {
    ...typography.strongMeta,
    color: colors.textInverse,
  },
  summaryStrip: {
    flexDirection: "row",
    gap: spacing.sm,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  summaryItem: {
    flex: 1,
    minWidth: 0,
  },
  summaryIconRow: {
    minHeight: 16,
  },
  summaryValue: {
    ...typography.label,
    color: colors.text,
  },
  summaryLabel: {
    ...typography.strongMeta,
    color: colors.muted,
  },
  kicker: {
    ...typography.strongMeta,
    color: colors.accent,
    textTransform: "uppercase",
  },
  title: {
    ...typography.screenTitle,
    color: colors.text,
  },
  shotCard: {
    flexDirection: "row",
    gap: spacing.md,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    padding: spacing.lg,
    backgroundColor: colors.surface,
  },
  shotIndex: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
    backgroundColor: colors.ink,
  },
  shotIndexText: {
    ...typography.strongMeta,
    color: colors.textInverse,
  },
  shotBody: {
    flex: 1,
    gap: 4,
  },
  rowAction: {
    alignItems: "center",
    justifyContent: "center",
  },
  shotTitle: {
    ...typography.label,
    color: colors.text,
  },
  mutedText: {
    ...typography.meta,
    color: colors.muted,
  },
  shotAction: {
    ...typography.strongMeta,
    alignSelf: "flex-start",
    overflow: "hidden",
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderColor: colors.border,
    borderWidth: 1,
    color: colors.primaryDark,
    backgroundColor: colors.backgroundAlt,
  },
  });
}
