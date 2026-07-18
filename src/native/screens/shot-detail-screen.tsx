import { Link, router } from "expo-router";
import {
  ArrowRight,
  CircleCheck,
  Droplets,
  Eye,
  Gauge,
  ListChecks,
  RefreshCw,
  Scale,
  SearchCheck,
  Timer,
  Trash2,
} from "lucide-react-native";
import { MagicWand } from "phosphor-react-native/src/icons/MagicWand";
import { Target } from "phosphor-react-native/src/icons/Target";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ShotRecord } from "../../domain/types";
import {
  formatActionDirection,
  formatActionVariable,
  formatKeepVariables,
} from "../formatters";
import { repository } from "../repository";
import { buildNextShotHref } from "../shotRoutes";
import {
  layout,
  radius,
  spacing,
  typography,
  useAppTheme,
  type AppColors,
} from "../theme";

type DetailState = "loading" | "ready" | "not-found" | "error";

export function ShotDetailScreen({ shotId }: { shotId?: string }) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(colors);
  const [shot, setShot] = useState<ShotRecord | null>(null);
  const [detailState, setDetailState] = useState<DetailState>(
    shotId ? "loading" : "not-found",
  );
  const [canDeleteLatest, setCanDeleteLatest] = useState(false);
  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | undefined>();
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!shotId) {
      setShot(null);
      setDetailState("not-found");
      return;
    }

    let isActive = true;
    setDetailState("loading");
    void (async () => {
      try {
        const value = await repository.getShot(shotId);
        if (!isActive) {
          return;
        }
        if (!value) {
          setShot(null);
          setCanDeleteLatest(false);
          setDetailState("not-found");
          return;
        }

        const [session, sessionShots] = await Promise.all([
          repository.getSession(value.sessionId),
          repository.listShots(value.sessionId),
        ]);
        if (!isActive) {
          return;
        }
        setShot(value);
        setCanDeleteLatest(
          session?.status === "active" && sessionShots.at(-1)?.id === value.id,
        );
        setDetailState("ready");
      } catch {
        if (isActive) {
          setShot(null);
          setCanDeleteLatest(false);
          setDetailState("error");
        }
      }
    })();

    return () => {
      isActive = false;
    };
  }, [reloadKey, shotId]);

  async function handleDeleteLatestShot() {
    if (!shot || isDeleting) {
      return;
    }

    setIsDeleting(true);
    setDeleteError(undefined);
    try {
      await repository.deleteLatestShot(shot.sessionId, shot.id);
      router.replace({
        pathname: "/session/[sessionId]",
        params: { sessionId: shot.sessionId },
      });
    } catch {
      setDeleteError(
        "최신 샷만 삭제할 수 있습니다. 세션 기록을 다시 확인해주세요.",
      );
      setIsDeleteConfirming(false);
    } finally {
      setIsDeleting(false);
    }
  }

  if (detailState === "loading") {
    return (
      <View style={styles.center}>
        <View style={styles.statePanel}>
          <Text selectable style={styles.mutedText}>
            샷 기록을 불러오는 중입니다.
          </Text>
        </View>
      </View>
    );
  }

  if (detailState === "error") {
    return (
      <View style={styles.center}>
        <View style={styles.statePanel}>
          <Text selectable style={styles.mutedText}>
            샷 기록을 불러오지 못했습니다. 다시 열어주세요.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => setReloadKey((key) => key + 1)}
            style={styles.nextShotButton}
          >
            <RefreshCw color={colors.textInverse} size={16} strokeWidth={2} />
            <Text selectable style={styles.nextShotButtonText}>
              다시 시도
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (detailState === "not-found" || !shot) {
    return (
      <View style={styles.center}>
        <View style={styles.statePanel}>
          <Text selectable style={styles.mutedText}>
            샷 기록을 찾을 수 없습니다.
          </Text>
          <Link href="/sessions" asChild>
            <Pressable accessibilityRole="link" style={styles.secondaryButton}>
              <Text selectable style={styles.secondaryButtonText}>
                세션 목록으로
              </Text>
            </Pressable>
          </Link>
        </View>
      </View>
    );
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
      <View style={styles.resultCard}>
        <View style={styles.resultLabelRow}>
          <MagicWand color={colors.accent} size={17} weight="duotone" />
          <Text selectable style={styles.kicker}>
            다음 샷에서 딱 1개만
          </Text>
        </View>
        <Text selectable style={styles.primaryAction}>
          {shot.recommendation.primary.message}
        </Text>
        <View style={styles.primaryMeta}>
          <Target color={colors.accent} size={14} weight="fill" />
          <Text selectable style={styles.primaryMetaText}>
            {formatActionVariable(shot.recommendation.primary.variable)} ·{" "}
            {formatActionDirection(shot.recommendation.primary.direction)}
          </Text>
        </View>
        <Link href={buildNextShotHref(shot.sessionId)} asChild>
          <Pressable style={styles.nextShotButton}>
            <ArrowRight color={colors.textInverse} size={18} strokeWidth={2.2} />
            <Text selectable style={styles.nextShotButtonText}>
              다음 샷 기록
            </Text>
          </Pressable>
        </Link>
      </View>

      <View style={styles.factStrip}>
        <Fact
          icon={<Scale color={colors.accent} size={15} strokeWidth={2} />}
          label="도징량"
          styles={styles}
          value={`${shot.extraction.doseGrams}g`}
        />
        <Fact
          icon={<Droplets color={colors.accent} size={15} strokeWidth={2} />}
          label="추출량"
          styles={styles}
          value={`${shot.extraction.yieldGrams}g`}
        />
        <Fact
          icon={<Timer color={colors.accent} size={15} strokeWidth={2} />}
          label="시간"
          styles={styles}
          value={`${shot.extraction.brewSeconds}s`}
        />
        <Fact
          icon={<Gauge color={colors.accent} size={15} strokeWidth={2} />}
          label="비율"
          styles={styles}
          value={`1:${shot.extraction.brewRatio.toFixed(1)}`}
        />
      </View>

      <Section
        icon={<CircleCheck color={colors.accent} size={18} strokeWidth={2} />}
        title="그대로 둘 것"
        items={[formatKeepVariables(shot.recommendation.keepVariables)]}
        styles={styles}
      />
      <Section
        icon={<SearchCheck color={colors.accent} size={18} strokeWidth={2} />}
        title="판단 근거"
        items={shot.recommendation.rationale}
        styles={styles}
      />
      <Section
        icon={<Eye color={colors.accent} size={18} strokeWidth={2} />}
        title="다음에 확인"
        items={shot.recommendation.uncertainty}
        styles={styles}
      />
      <Section
        icon={<ListChecks color={colors.accent} size={18} strokeWidth={2} />}
        title="다른 후보"
        items={shot.recommendation.alternatives.map((action) => action.message)}
        styles={styles}
      />
      <View style={styles.card}>
        <Text selectable style={styles.sectionTitle}>
          맛 기록
        </Text>
        <Text selectable style={styles.bodyText}>
          {shot.extraction.tasteDescription}
        </Text>
      </View>

      {canDeleteLatest ? (
        <View style={styles.card}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionIcon}>
              <Trash2 color={colors.danger} size={18} strokeWidth={2} />
            </View>
            <Text selectable style={styles.sectionTitle}>
              기록 관리
            </Text>
          </View>
          {isDeleteConfirming ? (
            <>
              <Text selectable style={styles.bodyText}>
                이 샷과 추천 기록을 삭제합니다. 삭제 후에는 되돌릴 수 없습니다.
              </Text>
              <View style={styles.deleteActions}>
                <Pressable
                  accessibilityRole="button"
                  disabled={isDeleting}
                  onPress={() => setIsDeleteConfirming(false)}
                  style={styles.secondaryButton}
                >
                  <Text selectable style={styles.secondaryButtonText}>
                    취소
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ disabled: isDeleting }}
                  disabled={isDeleting}
                  onPress={() => void handleDeleteLatestShot()}
                  style={[styles.deleteButton, isDeleting && styles.buttonDisabled]}
                >
                  <Text selectable style={styles.deleteButtonText}>
                    {isDeleting ? "삭제 중" : "최신 샷 삭제"}
                  </Text>
                </Pressable>
              </View>
            </>
          ) : (
            <Pressable
              accessibilityRole="button"
              onPress={() => setIsDeleteConfirming(true)}
              style={styles.secondaryButton}
            >
              <Text selectable style={styles.deleteActionText}>
                최신 샷 삭제
              </Text>
            </Pressable>
          )}
          {deleteError ? (
            <Text selectable style={styles.deleteError}>
              {deleteError}
            </Text>
          ) : null}
        </View>
      ) : null}
    </ScrollView>
  );
}

function Section({
  icon,
  title,
  items,
  styles,
}: {
  icon?: ReactNode;
  title: string;
  items: string[];
  styles: ShotDetailStyles;
}) {
  if (items.length === 0) {
    return null;
  }
  return (
    <View style={styles.card}>
      <View style={styles.sectionTitleRow}>
        {icon ? <View style={styles.sectionIcon}>{icon}</View> : null}
        <Text selectable style={styles.sectionTitle}>
          {title}
        </Text>
      </View>
      {items.map((item) => (
        <Text selectable style={styles.bodyText} key={item}>
          {item}
        </Text>
      ))}
    </View>
  );
}

function Fact({
  icon,
  label,
  styles,
  value,
}: {
  icon?: ReactNode;
  label: string;
  styles: ShotDetailStyles;
  value: string;
}) {
  return (
    <View style={styles.factItem}>
      <View style={styles.factIconRow}>
        {icon}
      </View>
      <Text selectable style={styles.factValue}>
        {value}
      </Text>
      <Text selectable style={styles.factLabel}>
        {label}
      </Text>
    </View>
  );
}

type ShotDetailStyles = ReturnType<typeof createStyles>;

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
    gap: spacing.lg,
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
  resultCard: {
    gap: spacing.md,
    borderColor: colors.inkSoft,
    borderRadius: radius.sm,
    borderWidth: 1,
    padding: 20,
    backgroundColor: colors.ink,
  },
  resultLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  card: {
    gap: spacing.sm,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    padding: spacing.lg,
    backgroundColor: colors.surface,
  },
  kicker: {
    ...typography.strongMeta,
    color: colors.mutedInverse,
  },
  primaryAction: {
    ...typography.resultAction,
    color: colors.textInverse,
  },
  primaryMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    alignSelf: "flex-start",
    overflow: "hidden",
    borderColor: colors.accent,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  primaryMetaText: {
    ...typography.strongMeta,
    color: colors.textInverse,
  },
  nextShotButton: {
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: layout.minTouchSize,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
    backgroundColor: colors.primaryDark,
  },
  nextShotButtonText: {
    ...typography.button,
    color: colors.textInverse,
  },
  secondaryButton: {
    minHeight: layout.minTouchSize,
    alignItems: "center",
    justifyContent: "center",
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
  },
  secondaryButtonText: {
    ...typography.label,
    color: colors.primary,
  },
  deleteActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  deleteButton: {
    minHeight: layout.minTouchSize,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.danger,
  },
  deleteButtonText: {
    ...typography.label,
    color: colors.textInverse,
  },
  deleteActionText: {
    ...typography.label,
    color: colors.danger,
  },
  deleteError: {
    ...typography.label,
    color: colors.danger,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  sectionTitle: {
    ...typography.sectionTitle,
    color: colors.text,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    backgroundColor: colors.backgroundAlt,
  },
  bodyText: {
    ...typography.body,
    color: colors.text,
  },
  mutedText: {
    ...typography.body,
    color: colors.muted,
  },
  factStrip: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  factItem: {
    flex: 1,
    minWidth: 0,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    padding: spacing.sm,
    backgroundColor: colors.surface,
  },
  factIconRow: {
    minHeight: 16,
  },
  factValue: {
    ...typography.numeric,
    color: colors.text,
  },
  factLabel: {
    ...typography.strongMeta,
    color: colors.muted,
  },
  });
}
