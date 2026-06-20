import { Link, router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Pressable,
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
import { colors, spacing } from "../theme";

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
  { id: "no_issue_observed", label: "이상한 점은 없었다" },
  { id: "one_sided_flow", label: "한쪽으로만 흘렀다" },
  { id: "spurting_or_spraying", label: "튀거나 샜다" },
  { id: "sudden_flow_acceleration", label: "흐름이 갑자기 빨라졌다" },
  { id: "cracked_puck", label: "퍽이 갈라졌다" },
  { id: "uneven_puck_surface", label: "퍽 표면이 고르지 않았다" },
  { id: "soupy_puck", label: "퍽이 질척했다" },
  { id: "tilted_tamp", label: "탬핑이 기울어진 것 같다" },
  { id: "uneven_distribution", label: "분배가 고르지 않았다" },
  { id: "not_sure", label: "잘 모르겠다" },
];

export function QuickDiagnosisScreen() {
  const [form, setForm] = useState<FormState>(initialFormState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeSession, setActiveSession] = useState<BeanSession | null>(null);
  const [recentShots, setRecentShots] = useState<ShotRecord[]>([]);

  useEffect(() => {
    void loadLatestSession();
  }, []);

  async function loadLatestSession() {
    const sessions = await repository.listSessions();
    const session = sessions.find((item) => item.status === "active") ?? null;
    setActiveSession(session);
    setRecentShots(session ? await repository.listShots(session.id) : []);
  }

  async function handleSubmit() {
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
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={styles.screen}
      contentContainerStyle={styles.content}
    >
      <View style={styles.form}>
        <InputField
          label="맛"
          value={form.tasteDescription}
          onChangeText={(tasteDescription) => setForm({ ...form, tasteDescription })}
          placeholder="예: 시고 끝맛이 떫다"
          multiline
          error={errors.tasteDescription}
        />

        <View style={styles.numberGrid}>
          <InputField
            label="도징량"
            value={form.doseGrams}
            onChangeText={(doseGrams) => setForm({ ...form, doseGrams })}
            placeholder="18.0"
            suffix="g"
            error={errors.doseGrams}
          />
          <InputField
            label="추출량"
            value={form.yieldGrams}
            onChangeText={(yieldGrams) => setForm({ ...form, yieldGrams })}
            placeholder="36.0"
            suffix="g"
            error={errors.yieldGrams}
          />
          <InputField
            label="시간"
            value={form.brewSeconds}
            onChangeText={(brewSeconds) => setForm({ ...form, brewSeconds })}
            placeholder="28"
            suffix="s"
            error={errors.brewSeconds}
          />
        </View>

        <InputField
          label="분쇄도 메모"
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

        <Pressable style={styles.primaryButton} onPress={handleSubmit}>
          <Text selectable style={styles.primaryButtonText}>
            추천 받기
          </Text>
        </Pressable>
      </View>

      <View style={styles.history}>
        <Text selectable style={styles.sectionTitle}>
          최근 샷
        </Text>
        <Link href="/sessions" asChild>
          <Pressable style={styles.secondaryButton}>
            <Text selectable style={styles.secondaryButtonText}>
              세션 목록 보기
            </Text>
          </Pressable>
        </Link>
        {activeSession ? (
          <Link
            href={{
              pathname: "/session/[sessionId]",
              params: { sessionId: activeSession.id },
            }}
            asChild
          >
            <Pressable style={styles.secondaryButton}>
              <Text selectable style={styles.secondaryButtonText}>
                세션 기록 보기
              </Text>
            </Pressable>
          </Link>
        ) : null}
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
                <Text selectable style={styles.shotTitle}>
                  Shot {String(shot.shotNumber).padStart(2, "0")}
                </Text>
                <Text selectable style={styles.mutedText}>
                  1:{shot.extraction.brewRatio.toFixed(1)} ·{" "}
                  {shot.extraction.brewSeconds}s
                </Text>
              </Pressable>
            </Link>
          ))
        )}
      </View>
    </ScrollView>
  );
}

function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  suffix,
  multiline = false,
  error,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  suffix?: string;
  multiline?: boolean;
  error?: string;
}) {
  return (
    <View style={styles.field}>
      <Text selectable style={styles.label}>
        {label}
      </Text>
      <View style={styles.inputRow}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    gap: spacing.lg,
    padding: spacing.lg,
  },
  form: {
    gap: spacing.lg,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    padding: spacing.lg,
    backgroundColor: colors.surface,
  },
  field: {
    gap: spacing.xs,
  },
  label: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 44,
    borderColor: colors.border,
    borderRadius: 10,
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
    color: colors.muted,
    fontWeight: "700",
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: "600",
  },
  numberGrid: {
    gap: spacing.md,
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
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceAlt,
  },
  optionText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
  },
  optionTextSelected: {
    color: colors.primary,
  },
  primaryButton: {
    alignItems: "center",
    borderRadius: 12,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
  history: {
    gap: spacing.sm,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    padding: spacing.lg,
    backgroundColor: colors.surface,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  secondaryButton: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: spacing.sm,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontWeight: "800",
  },
  shotCard: {
    gap: 4,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    padding: spacing.md,
  },
  shotTitle: {
    color: colors.text,
    fontWeight: "800",
  },
  mutedText: {
    color: colors.muted,
  },
});
