import { Link } from "expo-router";
import {
  ArrowRight,
  CircleCheck,
  Droplets,
  Eye,
  Gauge,
  ListChecks,
  Scale,
  SearchCheck,
  Timer,
} from "lucide-react-native";
import { MagicWand } from "phosphor-react-native/src/icons/MagicWand";
import { Target } from "phosphor-react-native/src/icons/Target";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
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
  const styles = createStyles(colors);
  const [shot, setShot] = useState<ShotRecord | null>(null);
  const [detailState, setDetailState] = useState<DetailState>(
    shotId ? "loading" : "not-found",
  );

  useEffect(() => {
    if (!shotId) {
      setShot(null);
      setDetailState("not-found");
      return;
    }

    let isActive = true;
    setDetailState("loading");
    void repository
      .getShot(shotId)
      .then((value) => {
        if (!isActive) {
          return;
        }
        setShot(value ?? null);
        setDetailState(value ? "ready" : "not-found");
      })
      .catch(() => {
        if (isActive) {
          setShot(null);
          setDetailState("error");
        }
      });

    return () => {
      isActive = false;
    };
  }, [shotId]);

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
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={styles.screen}
      contentContainerStyle={styles.content}
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
