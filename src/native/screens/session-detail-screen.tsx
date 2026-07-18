import { Link } from "expo-router";
import {
  Archive,
  ChevronRight,
  ClipboardList,
  Coffee,
  Gauge,
  History,
  Pencil,
  RefreshCw,
  RotateCcw,
  Target,
} from "lucide-react-native";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { BeanSession, ShotRecord } from "../../domain/types";
import { formatActionVariable, formatSessionStatus } from "../formatters";
import { repository } from "../repository";
import {
  layout,
  radius,
  spacing,
  typography,
  useAppTheme,
  type AppColors,
} from "../theme";

type DetailState = "loading" | "ready" | "not-found" | "error";

export function SessionDetailScreen({ sessionId }: { sessionId?: string }) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(colors);
  const [session, setSession] = useState<BeanSession | null>(null);
  const [shots, setShots] = useState<ShotRecord[]>([]);
  const [detailState, setDetailState] = useState<DetailState>(
    sessionId ? "loading" : "not-found",
  );
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState<string | undefined>();
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!sessionId) {
      setSession(null);
      setShots([]);
      setDetailState("not-found");
      return;
    }

    let isActive = true;
    setDetailState("loading");
    void (async () => {
      try {
        const nextSession = await repository.getSession(sessionId);
        if (!isActive) {
          return;
        }
        if (!nextSession) {
          setSession(null);
          setShots([]);
          setDetailState("not-found");
          return;
        }
        const nextShots = await repository.listShots(sessionId);
        if (!isActive) {
          return;
        }
        setSession(nextSession);
        setShots(nextShots);
        setDetailState("ready");
      } catch {
        if (isActive) {
          setSession(null);
          setShots([]);
          setDetailState("error");
        }
      }
    })();

    return () => {
      isActive = false;
    };
  }, [reloadKey, sessionId]);

  if (detailState === "loading") {
    return (
      <StatePanel
        iconColor={colors.textInverse}
        styles={styles}
        message="세션 기록을 불러오는 중입니다."
      />
    );
  }

  if (detailState === "error") {
    return (
      <StatePanel
        iconColor={colors.textInverse}
        styles={styles}
        message="세션 기록을 불러오지 못했습니다. 다시 열어주세요."
        onRetry={() => setReloadKey((key) => key + 1)}
      />
    );
  }

  if (detailState === "not-found" || !session) {
    return (
      <StatePanel
        iconColor={colors.textInverse}
        styles={styles}
        message="세션 기록을 찾을 수 없습니다."
        showBackLink
      />
    );
  }

  const latestShot = shots[shots.length - 1];

  async function handleSessionStatusAction() {
    const currentSession = session;
    if (isUpdatingStatus || !currentSession) {
      return;
    }

    setIsUpdatingStatus(true);
    setStatusError(undefined);
    try {
      const updatedSession =
        currentSession.status === "active"
          ? await repository.archiveSession(currentSession.id)
          : await repository.restoreSession(currentSession.id);
      setSession(updatedSession);
    } catch {
      setStatusError(
        currentSession.status === "active"
          ? "세션을 보관하지 못했습니다. 다시 시도해주세요."
          : "세션을 복원하지 못했습니다. 다시 시도해주세요.",
      );
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: layout.scrollBottomPadding + insets.bottom },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View style={styles.headerIcon}>
            <ClipboardList color={colors.accent} size={18} strokeWidth={2} />
          </View>
          <View style={styles.headerTitleText}>
            <Text selectable style={styles.kicker}>
              세션
            </Text>
            <Text accessibilityRole="header" selectable style={styles.title}>
              {session.name}
            </Text>
          </View>
        </View>
        <View style={styles.headerMeta}>
          <View style={styles.statusBadge}>
            <Text
              accessibilityLabel={`세션 상태: ${formatSessionStatus(session.status)}`}
              selectable
              style={styles.statusBadgeText}
            >
              {formatSessionStatus(session.status)}
            </Text>
          </View>
          <View style={styles.countBadge}>
            <History color={colors.textInverse} size={13} strokeWidth={2} />
            <Text selectable style={styles.countBadgeText}>
              샷 {shots.length}개
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.statusActionRow}>
        {session.status === "active" ? (
          <Link
            href={{ pathname: "/", params: { sessionId: session.id } }}
            asChild
          >
            <Pressable accessibilityRole="link" style={styles.primaryActionButton}>
              <Coffee color={colors.textInverse} size={16} strokeWidth={2} />
              <Text selectable style={styles.primaryActionButtonText}>
                다음 샷 기록
              </Text>
            </Pressable>
          </Link>
        ) : null}
        <Link
          href={{ pathname: "/sessions", params: { editSessionId: session.id } }}
          asChild
        >
          <Pressable accessibilityRole="link" style={styles.secondaryActionButton}>
            <Pencil color={colors.primary} size={16} strokeWidth={2} />
            <Text selectable style={styles.secondaryActionButtonText}>
              세션 수정
            </Text>
          </Pressable>
        </Link>
        <Pressable
          accessibilityLabel={
            session.status === "active" ? "세션 보관" : "세션 복원"
          }
          accessibilityRole="button"
          accessibilityState={{ disabled: isUpdatingStatus }}
          disabled={isUpdatingStatus}
          onPress={() => void handleSessionStatusAction()}
          style={[
            styles.secondaryActionButton,
            isUpdatingStatus && styles.actionButtonDisabled,
          ]}
        >
          {session.status === "active" ? (
            <Archive color={colors.primary} size={16} strokeWidth={2} />
          ) : (
            <RotateCcw color={colors.primary} size={16} strokeWidth={2} />
          )}
          <Text selectable style={styles.secondaryActionButtonText}>
            {session.status === "active" ? "보관" : "복원"}
          </Text>
        </Pressable>
      </View>
      {statusError ? (
        <Text selectable style={styles.statusError}>
          {statusError}
        </Text>
      ) : null}

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

      {shots.length === 0 ? (
        <View style={styles.emptyPanel}>
          <Text selectable style={styles.mutedText}>
            이 세션에는 아직 저장된 샷이 없습니다.
          </Text>
        </View>
      ) : (
        shots.map((shot) => (
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
        ))
      )}
    </ScrollView>
  );
}

function StatePanel({
  iconColor,
  message,
  onRetry,
  showBackLink = false,
  styles,
}: {
  iconColor: string;
  message: string;
  onRetry?: () => void;
  showBackLink?: boolean;
  styles: SessionDetailStyles;
}) {
  return (
    <View style={styles.center}>
      <View style={styles.statePanel}>
        <Text selectable style={styles.stateText}>
          {message}
        </Text>
        {onRetry ? (
          <Pressable accessibilityRole="button" onPress={onRetry} style={styles.primaryActionButton}>
            <RefreshCw color={iconColor} size={16} strokeWidth={2} />
            <Text selectable style={styles.primaryActionButtonText}>
              다시 시도
            </Text>
          </Pressable>
        ) : null}
        {showBackLink ? (
          <Link href="/sessions" asChild>
            <Pressable accessibilityRole="link" style={styles.secondaryActionButton}>
              <Text selectable style={styles.secondaryActionButtonText}>
                세션 목록으로
              </Text>
            </Pressable>
          </Link>
        ) : null}
      </View>
    </View>
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

type SessionDetailStyles = ReturnType<typeof createStyles>;

function createStyles(colors: AppColors) {
  return StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    width: "100%",
    maxWidth: layout.contentMaxWidth,
    alignSelf: "center",
    gap: spacing.md,
    padding: layout.screenPadding,
    paddingBottom: layout.scrollBottomPadding,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: layout.screenPadding,
    backgroundColor: colors.background,
  },
  statePanel: {
    alignItems: "flex-start",
    gap: spacing.md,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    padding: spacing.lg,
    backgroundColor: colors.surface,
  },
  stateText: {
    ...typography.body,
    color: colors.muted,
  },
  header: {
    alignItems: "flex-start",
    gap: spacing.md,
  },
  headerTitleRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minWidth: 0,
  },
  headerTitleText: {
    flex: 1,
    minWidth: 0,
  },
  headerMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
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
  statusBadge: {
    overflow: "hidden",
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.backgroundAlt,
  },
  statusBadgeText: {
    ...typography.strongMeta,
    color: colors.primary,
  },
  statusActionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  primaryActionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    minHeight: layout.minTouchSize,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primaryDark,
  },
  primaryActionButtonText: {
    ...typography.label,
    color: colors.textInverse,
  },
  secondaryActionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    minHeight: layout.minTouchSize,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
  },
  secondaryActionButtonText: {
    ...typography.label,
    color: colors.primary,
  },
  actionButtonDisabled: {
    opacity: 0.65,
  },
  statusError: {
    ...typography.label,
    color: colors.danger,
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
  emptyPanel: {
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
