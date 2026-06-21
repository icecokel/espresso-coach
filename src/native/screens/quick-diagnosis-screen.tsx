import { Link, router } from "expo-router";
import {
  ChevronRight,
  ClipboardList,
  Coffee,
  Droplets,
  History,
  Scale,
  SlidersHorizontal,
  Timer,
  WandSparkles,
} from "lucide-react-native";
import { Sparkle } from "phosphor-react-native/src/icons/Sparkle";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  Pressable,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { buildRecommendation } from "../../domain/recommendation";
import {
  buildExtraction,
  deriveBasicObservation,
  validateQuickDiagnosisInput,
} from "../../domain/quickDiagnosis";
import { parseTasteDescription } from "../../domain/taste";
import type {
  BeanSession,
  PrepObservationId,
  ShotChange,
  ShotChangeDirection,
  ShotChangeVariable,
  ShotRecord,
} from "../../domain/types";
import { createAutoBeanSession } from "../../storage/repository";
import { repository } from "../repository";
import {
  layout,
  radius,
  spacing,
  typography,
  useAppTheme,
  type AppColors,
} from "../theme";

interface FormState {
  tasteDescription: string;
  doseGrams: string;
  yieldGrams: string;
  brewSeconds: string;
  grindNote: string;
  prepObservations: PrepObservationId[];
  changedVariable: "none" | "unknown" | ShotChangeVariable;
  changeDirection: ShotChangeDirection;
}

const initialFormState: FormState = {
  tasteDescription: "",
  doseGrams: "",
  yieldGrams: "",
  brewSeconds: "",
  grindNote: "",
  prepObservations: [],
  changedVariable: "none",
  changeDirection: "unknown",
};

const prepOptions: Array<{ id: PrepObservationId; label: string }> = [
  { id: "no_issue_observed", label: "이상 없음" },
  { id: "one_sided_flow", label: "한쪽 흐름" },
  { id: "spurting_or_spraying", label: "튀거나 샜다" },
  { id: "sudden_flow_acceleration", label: "갑자기 빨라짐" },
  { id: "cracked_puck", label: "갈라진 퍽" },
  { id: "uneven_puck_surface", label: "고르지 않은 퍽" },
  { id: "soupy_puck", label: "질척함" },
  { id: "tilted_tamp", label: "탬핑 기울음" },
  { id: "uneven_distribution", label: "분배 불균일" },
  { id: "not_sure", label: "모름" },
];

export function QuickDiagnosisScreen() {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const [form, setForm] = useState<FormState>(initialFormState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSession, setActiveSession] = useState<BeanSession | null>(null);
  const [recentShots, setRecentShots] = useState<ShotRecord[]>([]);
  const nextShotNumber = recentShots.length + 1;

  useEffect(() => {
    void loadLatestSession();
  }, []);

  async function loadLatestSession() {
    try {
      const sessions = await repository.listSessions();
      const session = sessions.find((item) => item.status === "active") ?? null;
      setActiveSession(session);
      setRecentShots(session ? await repository.listShots(session.id) : []);
    } catch {
      setSubmitError("세션 기록을 불러오지 못했습니다.");
    }
  }

  async function handleSubmit() {
    if (isSubmitting) {
      return;
    }

    setSubmitError(undefined);
    const requiredInput = {
      tasteDescription: form.tasteDescription,
      doseGrams: parseNumber(form.doseGrams),
      yieldGrams: parseNumber(form.yieldGrams),
      brewSeconds: parseNumber(form.brewSeconds),
    };
    const validation = validateQuickDiagnosisInput(requiredInput);
    setErrors(validation.errors);
    if (!validation.ok) {
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();
      const session =
        activeSession ??
        (await repository.createSession(createAutoBeanSession({ now })));
      const shotNumber = await repository.getNextShotNumber(session.id);
      const extraction = buildExtraction(requiredInput);
      const basicObservation = deriveBasicObservation({
        grindNote: form.grindNote,
        prepObservations: form.prepObservations,
      });
      const { tasteTags, tastePatterns } = parseTasteDescription(
        extraction.tasteDescription,
      );
      const changesFromPrevious = buildShotChanges(form);
      const recommendation = buildRecommendation({
        session,
        extraction,
        basicObservation,
        changesFromPrevious,
        tasteTags,
        tastePatterns,
      });
      const savedShot = await repository.createShot({
        id: createId("shot"),
        sessionId: session.id,
        shotNumber,
        extraction,
        basicObservation,
        advancedObservation: null,
        changesFromPrevious,
        tasteTags,
        tastePatterns,
        recommendation,
        pulledAt: now,
        createdAt: now,
        updatedAt: now,
      });

      setActiveSession(session);
      setRecentShots(await repository.listShots(session.id));
      setForm(initialFormState);
      router.push({ pathname: "/shot/[shotId]", params: { shotId: savedShot.id } });
    } catch {
      setSubmitError("추천을 저장하지 못했습니다. 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function togglePrepObservation(id: PrepObservationId) {
    setForm((current) => ({
      ...current,
      prepObservations: current.prepObservations.includes(id)
        ? current.prepObservations.filter((value) => value !== id)
        : [...current.prepObservations, id],
    }));
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={styles.scroller}
        contentContainerStyle={styles.content}
      >
      <View style={styles.topBar}>
        <View style={styles.titleGroup}>
          <View style={styles.brandIcon}>
            <Image
              accessibilityIgnoresInvertColors
              source={require("../../../assets/espresso-coach-logo.png")}
              style={styles.brandImage}
            />
          </View>
          <View style={styles.titleTextGroup}>
          <Text selectable style={styles.screenTitle}>
            빠른 진단
          </Text>
          <Text selectable style={styles.screenSubtitle}>
            이번 샷을 기록하고 다음 조정을 받기
          </Text>
          </View>
        </View>
        <Text selectable style={styles.shotBadge}>
          샷 {String(nextShotNumber).padStart(2, "0")}
        </Text>
      </View>

      <View style={styles.statusStrip}>
        <View style={styles.statusItem}>
          <Coffee color={colors.muted} size={14} strokeWidth={1.8} />
          <Text selectable style={styles.statusItemText}>
            {activeSession?.name ?? "새 원두 세션"}
          </Text>
        </View>
        <View style={styles.statusItem}>
          <History color={colors.muted} size={14} strokeWidth={1.8} />
          <Text selectable style={styles.statusItemText}>
            최근 기록 {recentShots.length}
          </Text>
        </View>
        <View style={styles.statusItem}>
          <Sparkle color={colors.accent} size={14} weight="fill" />
          <Text selectable style={styles.statusItemText}>
            추천은 1개만
          </Text>
        </View>
      </View>

      <View style={styles.form}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIcon}>
            <ClipboardList color={colors.accent} size={18} strokeWidth={2} />
          </View>
          <View>
            <Text selectable style={styles.sectionKicker}>
              필수 입력
            </Text>
            <Text selectable style={styles.sectionTitle}>
              추출값
            </Text>
          </View>
        </View>
        <InputField
          colors={colors}
          label="맛"
          styles={styles}
          value={form.tasteDescription}
          onChangeText={(tasteDescription) => setForm({ ...form, tasteDescription })}
          placeholder="예: 시고 끝맛이 떫다"
          multiline
          error={errors.tasteDescription}
        />

        <View style={styles.numberGrid}>
          <InputField
            colors={colors}
            icon={<Scale color={colors.accent} size={14} strokeWidth={2} />}
            label="도징량"
            styles={styles}
            value={form.doseGrams}
            onChangeText={(doseGrams) => setForm({ ...form, doseGrams })}
            placeholder="18.0"
            suffix="g"
            error={errors.doseGrams}
          />
          <InputField
            colors={colors}
            icon={<Droplets color={colors.accent} size={14} strokeWidth={2} />}
            label="추출량"
            styles={styles}
            value={form.yieldGrams}
            onChangeText={(yieldGrams) => setForm({ ...form, yieldGrams })}
            placeholder="36.0"
            suffix="g"
            error={errors.yieldGrams}
          />
          <InputField
            colors={colors}
            icon={<Timer color={colors.accent} size={14} strokeWidth={2} />}
            label="시간"
            styles={styles}
            value={form.brewSeconds}
            onChangeText={(brewSeconds) => setForm({ ...form, brewSeconds })}
            placeholder="28"
            suffix="s"
            error={errors.brewSeconds}
          />
        </View>
      </View>

      <View style={styles.form}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIcon}>
            <SlidersHorizontal color={colors.accent} size={18} strokeWidth={2} />
          </View>
          <View>
            <Text selectable style={styles.sectionKicker}>
              선택 관찰
            </Text>
            <Text selectable style={styles.sectionTitle}>
              관찰
            </Text>
          </View>
        </View>
        <InputField
          colors={colors}
          label="분쇄도 메모"
          styles={styles}
          value={form.grindNote}
          onChangeText={(grindNote) => setForm({ ...form, grindNote })}
          placeholder="예: 18 클릭"
        />

        <View style={styles.group}>
          <Text selectable style={styles.label}>
            퍽/흐름
          </Text>
          <View style={styles.optionGrid}>
            {prepOptions.map((option) => (
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{
                  checked: form.prepObservations.includes(option.id),
                }}
                key={option.id}
                onPress={() => togglePrepObservation(option.id)}
                style={[
                  styles.option,
                  form.prepObservations.includes(option.id) && styles.optionSelected,
                ]}
              >
                <Text
                  selectable
                  style={[
                    styles.optionText,
                    form.prepObservations.includes(option.id) &&
                      styles.optionTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.group}>
          <Text selectable style={styles.label}>
            직전 샷 변경
          </Text>
          <View style={styles.optionGrid}>
            {[
              ["none", "변경 없음"],
              ["unknown", "모름"],
              ["grind_size", "분쇄도"],
              ["dose", "도징량"],
              ["yield", "추출량"],
              ["distribution", "분배"],
              ["tamping_consistency", "탬핑"],
              ["puck_prep", "퍽 준비"],
            ].map(([value, label]) => (
              <Pressable
                key={value}
                onPress={() =>
                  setForm({
                    ...form,
                    changedVariable: value as FormState["changedVariable"],
                  })
                }
                style={[
                  styles.option,
                  form.changedVariable === value && styles.optionSelected,
                ]}
              >
                <Text
                  selectable
                  style={[
                    styles.optionText,
                    form.changedVariable === value && styles.optionTextSelected,
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {form.changedVariable !== "none" && form.changedVariable !== "unknown" ? (
          <View style={styles.group}>
            <Text selectable style={styles.label}>
              변경 방향
            </Text>
            <View style={styles.optionGrid}>
              {[
                ["unknown", "방향 모름"],
                ["finer", "더 곱게"],
                ["coarser", "더 굵게"],
                ["increase", "늘림"],
                ["decrease", "줄임"],
                ["changed", "바꿈"],
              ].map(([value, label]) => (
                <Pressable
                  key={value}
                  onPress={() =>
                    setForm({
                      ...form,
                      changeDirection: value as ShotChangeDirection,
                    })
                  }
                  style={[
                    styles.option,
                    form.changeDirection === value && styles.optionSelected,
                  ]}
                >
                  <Text
                    selectable
                    style={[
                      styles.optionText,
                      form.changeDirection === value && styles.optionTextSelected,
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {submitError ? (
          <Text selectable style={styles.submitError}>
            {submitError}
          </Text>
        ) : null}
      </View>

      <View style={styles.history}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIcon}>
            <History color={colors.accent} size={18} strokeWidth={2} />
          </View>
          <View>
            <Text selectable style={styles.sectionKicker}>
              기록
            </Text>
            <Text selectable style={styles.sectionTitle}>
              최근 샷
            </Text>
          </View>
        </View>
        <Link href="/sessions" asChild>
          <Pressable accessibilityRole="link" style={styles.textAction}>
            <View style={styles.textActionContent}>
              <Text selectable style={styles.secondaryButtonText}>
                전체 세션 보기
              </Text>
              <ChevronRight color={colors.primary} size={16} strokeWidth={2.1} />
            </View>
          </Pressable>
        </Link>
        {recentShots.length === 0 ? (
          <Text selectable style={styles.mutedText}>
            기록된 샷이 없습니다.
          </Text>
        ) : (
          recentShots.slice(-3).map((shot) => (
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
                  <Text selectable style={styles.shotTitle} numberOfLines={1}>
                    {shot.extraction.tasteDescription}
                  </Text>
                  <Text selectable style={styles.mutedText}>
                    1:{shot.extraction.brewRatio.toFixed(1)} ·{" "}
                    {shot.extraction.brewSeconds}s · {shot.extraction.doseGrams}
                    g → {shot.extraction.yieldGrams}g
                  </Text>
                </View>
                <Text selectable style={styles.shotAction}>
                  {formatActionVariable(shot.recommendation.primary.variable)}
                </Text>
              </Pressable>
            </Link>
          ))
        )}
      </View>
      </ScrollView>

      <View style={styles.actionBar}>
        <Pressable
          accessibilityRole="button"
          disabled={isSubmitting}
          style={[styles.primaryButton, isSubmitting && styles.primaryButtonDisabled]}
          onPress={handleSubmit}
        >
          <WandSparkles color={colors.textInverse} size={19} strokeWidth={2.2} />
          <Text selectable style={styles.primaryButtonText}>
            {isSubmitting ? "저장 중" : "추천 받기"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function InputField({
  colors,
  icon,
  label,
  styles,
  value,
  onChangeText,
  placeholder,
  suffix,
  multiline = false,
  error,
}: {
  colors: AppColors;
  icon?: ReactNode;
  label: string;
  styles: QuickDiagnosisStyles;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  suffix?: string;
  multiline?: boolean;
  error?: string;
}) {
  return (
    <View style={styles.field}>
      <View style={styles.fieldLabelRow}>
        {icon}
        <Text selectable style={styles.label}>
          {label}
        </Text>
      </View>
      <View style={styles.inputRow}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          keyboardType={suffix ? "decimal-pad" : "default"}
          multiline={multiline}
          style={[styles.input, multiline && styles.textArea]}
        />
        {suffix ? (
          <Text selectable style={styles.suffix}>
            {suffix}
          </Text>
        ) : null}
      </View>
      {error ? (
        <Text selectable style={styles.errorText}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

function parseNumber(value: string): number {
  if (value.trim().length === 0) {
    return Number.NaN;
  }
  return Number(value);
}

function buildShotChanges(form: FormState): ShotChange[] {
  if (form.changedVariable === "none" || form.changedVariable === "unknown") {
    return [];
  }
  return [
    {
      variable: form.changedVariable,
      direction: form.changeDirection,
    },
  ];
}

function createId(prefix: "shot"): string {
  if (globalThis.crypto?.randomUUID) {
    return `${prefix}_${globalThis.crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now().toString(36)}`;
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

type QuickDiagnosisStyles = ReturnType<typeof createStyles>;

function createStyles(colors: AppColors) {
  return StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroller: {
    flex: 1,
  },
  content: {
    gap: spacing.lg,
    padding: layout.screenPadding,
    paddingBottom: 112,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  titleGroup: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  titleTextGroup: {
    flex: 1,
    gap: 2,
  },
  brandIcon: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
  brandImage: {
    width: "100%",
    height: "100%",
  },
  screenTitle: {
    ...typography.screenTitle,
    color: colors.text,
  },
  screenSubtitle: {
    ...typography.screenSubtitle,
    color: colors.muted,
  },
  shotBadge: {
    ...typography.strongMeta,
    overflow: "hidden",
    borderColor: colors.inkSoft,
    borderRadius: radius.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textInverse,
    backgroundColor: colors.ink,
  },
  statusStrip: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  statusItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  statusItemText: {
    ...typography.strongMeta,
    color: colors.muted,
  },
  form: {
    gap: spacing.lg,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    padding: spacing.lg,
    backgroundColor: colors.surface,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  sectionIcon: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    backgroundColor: colors.backgroundAlt,
  },
  sectionKicker: {
    ...typography.strongMeta,
    color: colors.accent,
  },
  field: {
    gap: spacing.xs,
    flex: 1,
    minWidth: 0,
  },
  fieldLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  label: {
    ...typography.label,
    color: colors.text,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minWidth: 0,
  },
  input: {
    ...typography.numeric,
    flex: 1,
    minWidth: 0,
    minHeight: 44,
    borderColor: colors.surfaceStrong,
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  textArea: {
    minHeight: 92,
    paddingTop: spacing.md,
    textAlignVertical: "top",
  },
  suffix: {
    ...typography.label,
    color: colors.muted,
  },
  errorText: {
    ...typography.label,
    color: colors.danger,
  },
  submitError: {
    ...typography.label,
    color: colors.danger,
  },
  numberGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  group: {
    gap: spacing.sm,
  },
  optionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  option: {
    minHeight: layout.minTouchSize,
    justifyContent: "center",
    borderColor: colors.surfaceStrong,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  optionSelected: {
    borderColor: colors.primaryDark,
    backgroundColor: colors.primaryDark,
  },
  optionText: {
    ...typography.body,
    color: colors.text,
  },
  optionTextSelected: {
    color: colors.textInverse,
  },
  primaryButton: {
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
    paddingVertical: spacing.lg,
    backgroundColor: colors.primary,
  },
  primaryButtonDisabled: {
    opacity: 0.65,
  },
  primaryButtonText: {
    ...typography.button,
    color: colors.textInverse,
  },
  history: {
    gap: spacing.md,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    padding: spacing.lg,
    backgroundColor: colors.surface,
  },
  sectionTitle: {
    ...typography.sectionTitle,
    color: colors.text,
  },
  textAction: {
    minHeight: layout.minTouchSize,
    justifyContent: "center",
  },
  textActionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  secondaryButtonText: {
    ...typography.label,
    color: colors.primary,
  },
  shotCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderColor: colors.surfaceStrong,
    borderRadius: radius.sm,
    borderWidth: 1,
    padding: spacing.md,
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
    minWidth: 0,
    gap: 2,
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
    flexShrink: 0,
    overflow: "hidden",
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderColor: colors.border,
    borderWidth: 1,
    color: colors.primaryDark,
    backgroundColor: colors.backgroundAlt,
  },
  actionBar: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    padding: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: colors.surface,
  },
  });
}
