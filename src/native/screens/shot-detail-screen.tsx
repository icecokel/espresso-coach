import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import type { ShotRecord } from "../../domain/types";
import { repository } from "../repository";
import { colors, spacing } from "../theme";

export function ShotDetailScreen({ shotId }: { shotId?: string }) {
  const [shot, setShot] = useState<ShotRecord | null>(null);

  useEffect(() => {
    if (shotId) {
      void repository.getShot(shotId).then((value) => setShot(value ?? null));
    }
  }, [shotId]);

  if (!shot) {
    return (
      <View style={styles.center}>
        <Text selectable style={styles.mutedText}>
          샷 기록을 찾을 수 없습니다.
        </Text>
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
        <Text selectable style={styles.kicker}>
          다음 샷
        </Text>
        <Text selectable style={styles.primaryAction}>
          {shot.recommendation.primary.message}
        </Text>
      </View>

      <Section title="왜 이렇게 보나요?" items={shot.recommendation.rationale} />
      <Section
        title="이번에는 그대로 둘 것"
        items={[formatKeepVariables(shot.recommendation.keepVariables)]}
      />
      <Section title="확인하면 좋은 점" items={shot.recommendation.uncertainty} />
      <Section
        title="다른 후보"
        items={shot.recommendation.alternatives.map((action) => action.message)}
      />
      <View style={styles.card}>
        <Text selectable style={styles.sectionTitle}>
          추출 기록
        </Text>
        <Text selectable style={styles.bodyText}>
          맛: {shot.extraction.tasteDescription}
        </Text>
        <Text selectable style={styles.bodyText}>
          도징량 {shot.extraction.doseGrams}g · 추출량{" "}
          {shot.extraction.yieldGrams}g · {shot.extraction.brewSeconds}s
        </Text>
        <Text selectable style={styles.bodyText}>
          비율 1:{shot.extraction.brewRatio.toFixed(1)}
        </Text>
      </View>
    </ScrollView>
  );
}

function formatKeepVariables(variables: string[]): string {
  if (variables.length === 0) {
    return "이번 샷에서는 추가로 유지할 변수가 없습니다.";
  }

  const labels: Record<string, string> = {
    grind_size: "분쇄도",
    dose: "도징량",
    yield: "추출량",
    tamping_consistency: "탬핑 방식",
    distribution: "레벨링/분배",
    puck_prep: "퍽 준비 과정",
    advanced_condition: "고급 조건",
  };

  return `${variables.map((variable) => labels[variable] ?? variable).join(", ")}은 그대로 두세요.`;
}

function Section({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) {
    return null;
  }
  return (
    <View style={styles.card}>
      <Text selectable style={styles.sectionTitle}>
        {title}
      </Text>
      {items.map((item) => (
        <Text selectable style={styles.bodyText} key={item}>
          {item}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    gap: spacing.lg,
    padding: spacing.lg,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  resultCard: {
    gap: spacing.sm,
    borderColor: "#c7dfd7",
    borderRadius: 14,
    borderWidth: 1,
    padding: spacing.lg,
    backgroundColor: colors.surfaceAlt,
  },
  card: {
    gap: spacing.sm,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    padding: spacing.lg,
    backgroundColor: colors.surface,
  },
  kicker: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "800",
  },
  primaryAction: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 30,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "800",
  },
  bodyText: {
    color: colors.text,
    lineHeight: 22,
  },
  mutedText: {
    color: colors.muted,
  },
});
