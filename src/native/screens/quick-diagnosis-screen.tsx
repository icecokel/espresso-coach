import { Link, router, useLocalSearchParams } from "expo-router";
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
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
import { useEffect, useRef, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { buildRecommendation } from "../../domain/recommendation";
import {
  buildExtraction,
  createInputWarningConfirmation,
  createSubmissionLock,
  deriveBasicObservation,
  shouldInvalidateInputWarningConfirmation,
  shouldRequestInputWarningConfirmation,
  type InputWarningConfirmation,
  validateQuickDiagnosisInput,
} from "../../domain/quickDiagnosis";
import { buildShotChangesFromComparison } from "../../domain/shotComparison";
import { parseTasteDescription } from "../../domain/taste";
import type {
  BeanSession,
  Extraction,
  ExtractionInputWarningCode,
  PrepObservationId,
  RoastRange,
  ShotChange,
  ShotChangeDirection,
  ShotChangeResult,
  ShotChangeVariable,
  ShotRecord,
} from "../../domain/types";
import {
  ARCHIVED_SESSION_SHOT_ERROR,
  createAutoBeanSession,
} from "../../storage/repository";
import {
  formatActionVariable,
  formatInputWarning,
  formatRoastRange,
  formatTasteTagPreview,
  roastRangeOptions,
} from "../formatters";
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
  changeResult: ShotChangeResult;
}

interface SessionFormState {
  name: string;
  beanName: string;
  roaster: string;
  roastRange: RoastRange;
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
  changeResult: "unknown",
};

const initialSessionFormState: SessionFormState = {
  name: "",
  beanName: "",
  roaster: "",
  roastRange: "unknown",
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

const changeVariableOptions: Array<{
  value: FormState["changedVariable"];
  label: string;
}> = [
  { value: "none", label: "변경 없음" },
  { value: "unknown", label: "모름" },
  { value: "grind_size", label: "분쇄도" },
  { value: "dose", label: "도징량" },
  { value: "yield", label: "추출량" },
  { value: "distribution", label: "분배" },
  { value: "tamping_consistency", label: "탬핑" },
  { value: "puck_prep", label: "퍽 준비" },
];

const changeResultOptions: Array<{ value: ShotChangeResult; label: string }> = [
  { value: "unknown", label: "결과 모름" },
  { value: "improved", label: "개선됨" },
  { value: "worse", label: "나빠짐" },
];

const archivedSessionSubmitError =
  "보관된 세션에서는 샷을 저장할 수 없습니다. 세션 목록에서 복원한 뒤 다시 시도하세요.";

export function QuickDiagnosisScreen() {
  const params = useLocalSearchParams<{ sessionId?: string | string[] }>();
  const { width: viewportWidth } = useWindowDimensions();
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const [form, setForm] = useState<FormState>(initialFormState);
  const [sessionForm, setSessionForm] = useState<SessionFormState>(
    initialSessionFormState,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | undefined>();
  const [inputWarningConfirmation, setInputWarningConfirmation] =
    useState<InputWarningConfirmation | null>(null);
  const [pendingInputWarnings, setPendingInputWarnings] = useState<
    ExtractionInputWarningCode[]
  >([]);
  const [sessionError, setSessionError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submissionLockRef = useRef(createSubmissionLock());
  const [isSavingSession, setIsSavingSession] = useState(false);
  const [isSessionDetailsOpen, setIsSessionDetailsOpen] = useState(false);
  const [isObservationOpen, setIsObservationOpen] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [sessionLoadError, setSessionLoadError] = useState<string | undefined>();
  const [sessions, setSessions] = useState<BeanSession[]>([]);
  const [activeSession, setActiveSession] = useState<BeanSession | null>(null);
  const [blockedArchivedSessionId, setBlockedArchivedSessionId] = useState<
    string | undefined
  >();
  const [recentShots, setRecentShots] = useState<ShotRecord[]>([]);
  const nextShotNumber = recentShots.length + 1;
  const previousShot = recentShots[recentShots.length - 1];
  const currentMeasuredExtraction = {
    doseGrams: parseNumber(form.doseGrams),
    yieldGrams: parseNumber(form.yieldGrams),
  };
  const detectedMeasuredChanges = buildShotChangesFromComparison({
    previousShot,
    currentExtraction: currentMeasuredExtraction,
  });
  const tasteTagPreview = formatTasteTagPreview(
    parseTasteDescription(form.tasteDescription).tasteTags,
  );

  useEffect(() => {
    void loadSessions(getRouteSessionId(params.sessionId));
  }, [params.sessionId]);

  async function loadSessions(preferredSessionId?: string) {
    setIsLoadingSessions(true);
    setSessionLoadError(undefined);
    try {
      const nextSessions = await repository.listSessions();
      const activeSessions = nextSessions.filter((item) => item.status === "active");
      const preferredSession = preferredSessionId
        ? nextSessions.find((item) => item.id === preferredSessionId)
        : undefined;

      setSessions(activeSessions);
      if (preferredSession?.status === "archived") {
        setBlockedArchivedSessionId(preferredSession.id);
        setActiveSession(null);
        setSessionForm(initialSessionFormState);
        setRecentShots([]);
        setSubmitError(archivedSessionSubmitError);
        return;
      }

      const session =
        activeSessions.find((item) => item.id === preferredSessionId) ??
        activeSessions[0] ??
        null;
      setBlockedArchivedSessionId(undefined);
      setActiveSession(session);
      setSessionForm(session ? formFromSession(session) : initialSessionFormState);
      setRecentShots(session ? await repository.listShots(session.id) : []);
    } catch {
      const error = "세션 기록을 불러오지 못했습니다. 다시 열어주세요.";
      setSessionLoadError(error);
      setSubmitError(error);
    } finally {
      setIsLoadingSessions(false);
    }
  }

  async function handleSelectSession(session: BeanSession) {
    if (session.status === "archived") {
      setBlockedArchivedSessionId(session.id);
      setActiveSession(null);
      setRecentShots([]);
      setSubmitError(archivedSessionSubmitError);
      return;
    }

    setBlockedArchivedSessionId(undefined);
    setActiveSession(session);
    setSessionForm(formFromSession(session));
    setIsSessionDetailsOpen(false);
    setSessionError(undefined);
    try {
      setRecentShots(await repository.listShots(session.id));
    } catch {
      setSessionError("선택한 세션의 샷 기록을 불러오지 못했습니다.");
      setRecentShots([]);
    }
  }

  async function handleSaveSession() {
    if (isSavingSession) {
      return;
    }

    setIsSavingSession(true);
    setSessionError(undefined);
    try {
      const now = new Date().toISOString();
      const patch = sessionPatchFromForm(sessionForm, now);
      const savedSession = activeSession
        ? await repository.updateSession(activeSession.id, patch)
        : await repository.createSession({
            ...createAutoBeanSession({ now, roastProfile: patch.roastProfile }),
            name: patch.name,
            beanName: patch.beanName,
            roaster: patch.roaster,
          });
      const nextSessions = await repository.listSessions();
      setSessions(nextSessions.filter((item) => item.status === "active"));
      setActiveSession(savedSession);
      setBlockedArchivedSessionId(undefined);
      setSessionForm(formFromSession(savedSession));
      setRecentShots(await repository.listShots(savedSession.id));
      setIsSessionDetailsOpen(false);
    } catch {
      setSessionError("세션을 저장하지 못했습니다. 다시 시도해주세요.");
    } finally {
      setIsSavingSession(false);
    }
  }

  function handleNewSessionDraft() {
    setBlockedArchivedSessionId(undefined);
    setActiveSession(null);
    setRecentShots([]);
    setSessionError(undefined);
    setSessionForm(initialSessionFormState);
    setIsSessionDetailsOpen(true);
  }

  async function handleSubmit(
    confirmationOverride?: InputWarningConfirmation,
  ) {
    if (!submissionLockRef.current.acquire()) {
      return;
    }

    try {
      setSubmitError(undefined);
      if (isLoadingSessions) {
        setSubmitError("세션을 불러오는 중입니다. 잠시 후 다시 시도하세요.");
        return;
      }
      if (sessionLoadError) {
        setSubmitError(sessionLoadError);
        return;
      }
      if (blockedArchivedSessionId) {
        setSubmitError(archivedSessionSubmitError);
        return;
      }
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

      const extraction = buildExtraction(requiredInput);
      const confirmation = confirmationOverride ?? inputWarningConfirmation;
      if (
        shouldRequestInputWarningConfirmation({
          input: requiredInput,
          inputWarnings: extraction.inputWarnings,
          confirmation,
        })
      ) {
        setPendingInputWarnings(extraction.inputWarnings);
        return;
      }

      setPendingInputWarnings([]);
      setIsSubmitting(true);
      const now = new Date().toISOString();
      const session = await saveSessionForShot(now);
      const basicObservation = deriveBasicObservation({
        grindNote: form.grindNote,
        prepObservations: form.prepObservations,
      });
      const { tasteTags, tastePatterns } = parseTasteDescription(
        extraction.tasteDescription,
      );
      const changesFromPrevious = buildShotChanges(form, previousShot, extraction);
      const recommendation = buildRecommendation({
        session,
        extraction,
        basicObservation,
        changesFromPrevious,
        tasteTags,
        tastePatterns,
      });
      const savedShot = await repository.createShotWithNextNumber({
        id: createId("shot"),
        sessionId: session.id,
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
      setSessionForm(formFromSession(session));
      setSessions(
        (await repository.listSessions()).filter((item) => item.status === "active"),
      );
      setRecentShots(await repository.listShots(session.id));
      setForm(initialFormState);
      router.push({ pathname: "/shot/[shotId]", params: { shotId: savedShot.id } });
    } catch (error) {
      setSubmitError(
        error instanceof Error && error.message === ARCHIVED_SESSION_SHOT_ERROR
          ? archivedSessionSubmitError
          : "추천을 저장하지 못했습니다. 다시 시도해주세요.",
      );
    } finally {
      setIsSubmitting(false);
      submissionLockRef.current.release();
    }
  }

  function handleConfirmInputWarnings() {
    const confirmation = createInputWarningConfirmation({
      tasteDescription: form.tasteDescription,
      doseGrams: parseNumber(form.doseGrams),
      yieldGrams: parseNumber(form.yieldGrams),
      brewSeconds: parseNumber(form.brewSeconds),
    });
    setInputWarningConfirmation(confirmation);
    void handleSubmit(confirmation);
  }

  function handleMeasuredValueChange(
    field: "doseGrams" | "yieldGrams" | "brewSeconds",
    value: string,
  ) {
    if (shouldInvalidateInputWarningConfirmation(field, form[field], value)) {
      setInputWarningConfirmation(null);
      setPendingInputWarnings([]);
    }
    setForm({ ...form, [field]: value });
  }

  function togglePrepObservation(id: PrepObservationId) {
    setForm((current) => ({
      ...current,
      prepObservations: current.prepObservations.includes(id)
        ? current.prepObservations.filter((value) => value !== id)
        : [...current.prepObservations, id],
    }));
  }

  async function saveSessionForShot(now: string): Promise<BeanSession> {
    const patch = sessionPatchFromForm(sessionForm, now);
    if (activeSession) {
      const currentSession = await repository.getSession(activeSession.id);
      if (!currentSession || currentSession.status === "archived") {
        throw new Error(ARCHIVED_SESSION_SHOT_ERROR);
      }
      return repository.updateSession(currentSession.id, patch);
    }

    return repository.createSession({
      ...createAutoBeanSession({ now, roastProfile: patch.roastProfile }),
      name: patch.name,
      beanName: patch.beanName,
      roaster: patch.roaster,
    });
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.keyboardAvoiding}
    >
      <SafeAreaView edges={["top", "bottom"]} style={styles.screen}>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
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
            {activeSession?.name ?? "새 세션 준비 중"}
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
        {tasteTagPreview ? (
          <View style={styles.tastePreview}>
            <Text selectable style={styles.tastePreviewLabel}>
              맛 해석
            </Text>
            <Text selectable style={styles.tastePreviewText}>
              {tasteTagPreview}
            </Text>
          </View>
        ) : null}

        <View style={styles.numberGrid}>
          <View
            style={[
              styles.numberField,
              viewportWidth < 360 && styles.numberFieldCompact,
            ]}
          >
            <InputField
              colors={colors}
              icon={<Scale color={colors.accent} size={14} strokeWidth={2} />}
              label="도징량"
              styles={styles}
              value={form.doseGrams}
              onChangeText={(doseGrams) =>
                handleMeasuredValueChange("doseGrams", doseGrams)
              }
              placeholder="18.0"
              suffix="g"
              error={errors.doseGrams}
            />
          </View>
          <View
            style={[
              styles.numberField,
              viewportWidth < 360 && styles.numberFieldCompact,
            ]}
          >
            <InputField
              colors={colors}
              icon={<Droplets color={colors.accent} size={14} strokeWidth={2} />}
              label="추출량"
              styles={styles}
              value={form.yieldGrams}
              onChangeText={(yieldGrams) =>
                handleMeasuredValueChange("yieldGrams", yieldGrams)
              }
              placeholder="36.0"
              suffix="g"
              error={errors.yieldGrams}
            />
          </View>
          <View
            style={[
              styles.numberField,
              viewportWidth < 360 && styles.numberFieldCompact,
            ]}
          >
            <InputField
              colors={colors}
              icon={<Timer color={colors.accent} size={14} strokeWidth={2} />}
              label="시간"
              styles={styles}
              value={form.brewSeconds}
              onChangeText={(brewSeconds) =>
                handleMeasuredValueChange("brewSeconds", brewSeconds)
              }
              placeholder="28"
              suffix="s"
              error={errors.brewSeconds}
            />
          </View>
        </View>
        {previousShot
          ? detectedMeasuredChanges.map((change) => (
              <Text key={change.variable} selectable style={styles.mutedText}>
                {formatDetectedMeasuredChange(
                  change,
                  previousShot.extraction,
                  currentMeasuredExtraction,
                )}
              </Text>
            ))
          : null}
      </View>

      <View style={styles.form}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIcon}>
            <Coffee color={colors.accent} size={18} strokeWidth={2} />
          </View>
          <View>
            <Text selectable style={styles.sectionKicker}>
              현재 세션
            </Text>
            <Text selectable style={styles.sectionTitle}>
              원두 정보
            </Text>
          </View>
        </View>

        {isLoadingSessions ? (
          <Text selectable style={styles.mutedText}>
            세션을 불러오는 중입니다.
          </Text>
        ) : null}
        {sessionLoadError ? (
          <View style={styles.group}>
            <Text selectable style={styles.submitError}>
              {sessionLoadError}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => void loadSessions(getRouteSessionId(params.sessionId))}
              style={styles.secondaryButton}
            >
              <Text selectable style={styles.secondaryButtonText}>
                다시 시도
              </Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.sessionPicker}>
          {sessions.length === 0 ? (
            <Text selectable style={styles.mutedText}>
              저장된 세션이 없습니다. 첫 샷은 새 세션에 자동으로 저장됩니다.
            </Text>
          ) : (
            sessions.map((session) => (
              <Pressable
                aria-checked={activeSession?.id === session.id}
                accessibilityRole="radio"
                accessibilityState={{
                  checked: activeSession?.id === session.id,
                }}
                key={session.id}
                onPress={() => void handleSelectSession(session)}
                style={[
                  styles.sessionOption,
                  activeSession?.id === session.id && styles.sessionOptionSelected,
                ]}
              >
                <Text
                  selectable
                  style={[
                    styles.sessionOptionText,
                    activeSession?.id === session.id && styles.sessionOptionTextSelected,
                  ]}
                >
                  {session.name}
                </Text>
                <Text
                  selectable
                  style={[
                    styles.sessionOptionMeta,
                    activeSession?.id === session.id && styles.sessionOptionTextSelected,
                  ]}
                >
                  {formatRoastRange(session.roastProfile.range)}
                </Text>
              </Pressable>
            ))
          )}
        </View>

        <Pressable
          aria-expanded={isSessionDetailsOpen}
          accessibilityLabel={isSessionDetailsOpen ? "원두 정보 닫기" : "원두 정보 추가 또는 수정"}
          accessibilityRole="button"
          accessibilityState={{ expanded: isSessionDetailsOpen }}
          onPress={() => setIsSessionDetailsOpen((open) => !open)}
          style={styles.sectionToggle}
        >
          <Text selectable style={styles.secondaryButtonText}>
            {isSessionDetailsOpen ? "원두 정보 닫기" : "원두 정보 추가·수정"}
          </Text>
          {isSessionDetailsOpen ? (
            <ChevronUp color={colors.primary} size={18} strokeWidth={2} />
          ) : (
            <ChevronDown color={colors.primary} size={18} strokeWidth={2} />
          )}
        </Pressable>

        {isSessionDetailsOpen ? (
          <>
            <View style={styles.sessionFieldGrid}>
              <InputField
                colors={colors}
                label="세션 이름"
                styles={styles}
                value={sessionForm.name}
                onChangeText={(name) => setSessionForm({ ...sessionForm, name })}
                placeholder="예: 과테말라 7월"
              />
              <InputField
                colors={colors}
                label="원두명"
                styles={styles}
                value={sessionForm.beanName}
                onChangeText={(beanName) =>
                  setSessionForm({ ...sessionForm, beanName })
                }
                placeholder="예: Guatemala Huehuetenango"
              />
              <InputField
                colors={colors}
                label="로스터"
                styles={styles}
                value={sessionForm.roaster}
                onChangeText={(roaster) =>
                  setSessionForm({ ...sessionForm, roaster })
                }
                placeholder="예: 동네 로스터리"
              />
            </View>

            <View style={styles.group}>
              <Text selectable style={styles.label}>
                배전 범위
              </Text>
              <View style={styles.optionGrid}>
                {roastRangeOptions.map((option) => (
                  <Pressable
                    aria-checked={sessionForm.roastRange === option.value}
                    accessibilityRole="radio"
                    accessibilityState={{
                      checked: sessionForm.roastRange === option.value,
                    }}
                    key={option.value}
                    onPress={() =>
                      setSessionForm({ ...sessionForm, roastRange: option.value })
                    }
                    style={[
                      styles.option,
                      sessionForm.roastRange === option.value && styles.optionSelected,
                    ]}
                  >
                    <Text
                      selectable
                      style={[
                        styles.optionText,
                        sessionForm.roastRange === option.value &&
                          styles.optionTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {sessionError ? (
              <Text selectable style={styles.submitError}>
                {sessionError}
              </Text>
            ) : null}

            <View style={styles.sessionActions}>
              <Pressable
                accessibilityRole="button"
                onPress={handleNewSessionDraft}
                style={styles.secondaryButton}
              >
                <Text selectable style={styles.secondaryButtonText}>
                  새 세션
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={isSavingSession}
                onPress={handleSaveSession}
                style={[
                  styles.saveButton,
                  isSavingSession && styles.primaryButtonDisabled,
                ]}
              >
                <Text selectable style={styles.saveButtonText}>
                  {isSavingSession
                    ? "저장 중"
                    : activeSession
                      ? "세션 수정"
                      : "세션 생성"}
                </Text>
              </Pressable>
            </View>
          </>
        ) : null}
      </View>

      <View style={styles.form}>
        <Pressable
          aria-expanded={isObservationOpen}
          accessibilityLabel={isObservationOpen ? "선택 관찰 닫기" : "선택 관찰 열기"}
          accessibilityRole="button"
          accessibilityState={{ expanded: isObservationOpen }}
          onPress={() => setIsObservationOpen((open) => !open)}
          style={styles.sectionToggleHeader}
        >
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <SlidersHorizontal color={colors.accent} size={18} strokeWidth={2} />
            </View>
            <View>
              <Text selectable style={styles.sectionKicker}>
                선택 입력
              </Text>
              <Text selectable style={styles.sectionTitle}>
                관찰 추가
              </Text>
            </View>
          </View>
          {isObservationOpen ? (
            <ChevronUp color={colors.primary} size={20} strokeWidth={2} />
          ) : (
            <ChevronDown color={colors.primary} size={20} strokeWidth={2} />
          )}
        </Pressable>

        {isObservationOpen ? (
          <>
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
                    aria-checked={form.prepObservations.includes(option.id)}
                    accessibilityRole="checkbox"
                    accessibilityState={{
                      checked: form.prepObservations.includes(option.id),
                    }}
                    key={option.id}
                    onPress={() => togglePrepObservation(option.id)}
                    style={[
                      styles.option,
                      form.prepObservations.includes(option.id) &&
                        styles.optionSelected,
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

            {previousShot ? (
              <>
                <View style={styles.group}>
                  <Text selectable style={styles.label}>
                    직전 샷 변경
                  </Text>
                  <View style={styles.optionGrid}>
                    {changeVariableOptions.map((option) => (
                      <Pressable
                        aria-checked={form.changedVariable === option.value}
                        accessibilityRole="radio"
                        accessibilityState={{
                          checked: form.changedVariable === option.value,
                        }}
                        key={option.value}
                        onPress={() =>
                          setForm({
                            ...form,
                            changedVariable: option.value,
                            changeDirection: "unknown",
                            changeResult: "unknown",
                          })
                        }
                        style={[
                          styles.option,
                          form.changedVariable === option.value && styles.optionSelected,
                        ]}
                      >
                        <Text
                          selectable
                          style={[
                            styles.optionText,
                            form.changedVariable === option.value &&
                              styles.optionTextSelected,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {form.changedVariable !== "none" &&
                form.changedVariable !== "unknown" ? (
                  <>
                    <View style={styles.group}>
                      <Text selectable style={styles.label}>
                        변경 방향
                      </Text>
                      <View style={styles.optionGrid}>
                        {getChangeDirectionOptions(form.changedVariable).map((option) => (
                          <Pressable
                            aria-checked={form.changeDirection === option.value}
                            accessibilityRole="radio"
                            accessibilityState={{
                              checked: form.changeDirection === option.value,
                            }}
                            key={option.value}
                            onPress={() =>
                              setForm({
                                ...form,
                                changeDirection: option.value,
                              })
                            }
                            style={[
                              styles.option,
                              form.changeDirection === option.value &&
                                styles.optionSelected,
                            ]}
                          >
                            <Text
                              selectable
                              style={[
                                styles.optionText,
                                form.changeDirection === option.value &&
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
                        결과
                      </Text>
                      <View style={styles.optionGrid}>
                        {changeResultOptions.map((option) => (
                          <Pressable
                            aria-checked={form.changeResult === option.value}
                            accessibilityRole="radio"
                            accessibilityState={{
                              checked: form.changeResult === option.value,
                            }}
                            key={option.value}
                            onPress={() =>
                              setForm({
                                ...form,
                                changeResult: option.value,
                              })
                            }
                            style={[
                              styles.option,
                              form.changeResult === option.value && styles.optionSelected,
                            ]}
                          >
                            <Text
                              selectable
                              style={[
                                styles.optionText,
                                form.changeResult === option.value &&
                                  styles.optionTextSelected,
                              ]}
                            >
                              {option.label}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  </>
                ) : null}
              </>
            ) : null}
          </>
        ) : null}
      </View>

      {submitError ? (
        <Text selectable style={styles.submitError}>
          {submitError}
        </Text>
      ) : null}

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
        {pendingInputWarnings.length > 0 ? (
          <View style={styles.inputWarningNotice}>
            <Text selectable style={styles.inputWarningTitle}>
              입력값 확인 필요
            </Text>
            <Text selectable style={styles.inputWarningDescription}>
              일반적인 범위를 벗어난 값입니다. 값을 다시 확인한 뒤 계속 저장하세요.
            </Text>
            {pendingInputWarnings.map((warning) => (
              <Text key={warning} selectable style={styles.inputWarningItem}>
                {formatInputWarning(warning)}
              </Text>
            ))}
          </View>
        ) : null}
        <Pressable
          accessibilityRole="button"
          disabled={isSubmitting}
          style={[styles.primaryButton, isSubmitting && styles.primaryButtonDisabled]}
          onPress={
            pendingInputWarnings.length > 0
              ? handleConfirmInputWarnings
              : () => void handleSubmit()
          }
        >
          <WandSparkles color={colors.textInverse} size={19} strokeWidth={2.2} />
          <Text selectable style={styles.primaryButtonText}>
            {isSubmitting
              ? "저장 중"
              : pendingInputWarnings.length > 0
                ? "이 값으로 계속 저장"
                : "추천 받기"}
          </Text>
        </Pressable>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
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
          accessibilityLabel={label}
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

function buildShotChanges(
  form: FormState,
  previousShot: ShotRecord | undefined,
  currentExtraction: Extraction,
): ShotChange[] {
  return buildShotChangesFromComparison({
    previousShot,
    currentExtraction,
    manualChange: buildManualShotChange(form),
  });
}

function buildManualShotChange(form: FormState): ShotChange | undefined {
  if (form.changedVariable === "none" || form.changedVariable === "unknown") {
    return undefined;
  }
  return {
    variable: form.changedVariable,
    direction: form.changeDirection,
    result: form.changeResult,
  };
}

function getChangeDirectionOptions(
  variable: FormState["changedVariable"],
): Array<{ value: ShotChangeDirection; label: string }> {
  if (variable === "grind_size") {
    return [
      { value: "unknown", label: "방향 모름" },
      { value: "finer", label: "더 곱게" },
      { value: "coarser", label: "더 굵게" },
    ];
  }

  if (variable === "dose" || variable === "yield") {
    return [
      { value: "unknown", label: "방향 모름" },
      { value: "increase", label: "늘림" },
      { value: "decrease", label: "줄임" },
    ];
  }

  return [
    { value: "unknown", label: "방향 모름" },
    { value: "changed", label: "바꿈" },
  ];
}

function formatDetectedMeasuredChange(
  change: Pick<ShotChange, "variable" | "direction">,
  previousExtraction: Pick<Extraction, "doseGrams" | "yieldGrams">,
  currentExtraction: Pick<Extraction, "doseGrams" | "yieldGrams">,
): string {
  const previousValue =
    change.variable === "dose"
      ? previousExtraction.doseGrams
      : previousExtraction.yieldGrams;
  const currentValue =
    change.variable === "dose"
      ? currentExtraction.doseGrams
      : currentExtraction.yieldGrams;
  const label = change.variable === "dose" ? "도징량" : "추출량";
  const direction = change.direction === "increase" ? "늘림" : "줄임";

  return `${label} ${previousValue}g → ${currentValue}g · ${direction}`;
}

function getRouteSessionId(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function formFromSession(session: BeanSession): SessionFormState {
  return {
    name: session.name,
    beanName: session.beanName ?? "",
    roaster: session.roaster ?? "",
    roastRange: session.roastProfile.range,
  };
}

function sessionPatchFromForm(form: SessionFormState, now: string) {
  return {
    name: formatSessionName(form.name, now),
    beanName: optionalText(form.beanName),
    roaster: optionalText(form.roaster),
    roastProfile: buildUserSelectedRoastProfile(form.roastRange),
  };
}

function formatSessionName(value: string, now: string): string {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : `새 원두 세션 ${now.slice(0, 10)}`;
}

function optionalText(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function buildUserSelectedRoastProfile(range: RoastRange) {
  return {
    range,
    confidence: range === "unknown" ? "low" : "medium",
    source: "user_selected",
  } as const;
}

function createId(prefix: "shot"): string {
  if (globalThis.crypto?.randomUUID) {
    return `${prefix}_${globalThis.crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now().toString(36)}`;
}

type QuickDiagnosisStyles = ReturnType<typeof createStyles>;

function createStyles(colors: AppColors) {
  return StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardAvoiding: {
    flex: 1,
  },
  scroller: {
    flex: 1,
  },
  content: {
    width: "100%",
    maxWidth: layout.contentMaxWidth,
    alignSelf: "center",
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
  sessionPicker: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  sessionOption: {
    minHeight: layout.minTouchSize,
    justifyContent: "center",
    gap: 2,
    borderColor: colors.surfaceStrong,
    borderRadius: radius.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  sessionOptionSelected: {
    borderColor: colors.primaryDark,
    backgroundColor: colors.ink,
  },
  sessionOptionText: {
    ...typography.label,
    color: colors.text,
  },
  sessionOptionMeta: {
    ...typography.meta,
    color: colors.muted,
  },
  sessionOptionTextSelected: {
    color: colors.textInverse,
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
  sectionToggleHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  sectionToggle: {
    flexDirection: "row",
    minHeight: layout.minTouchSize,
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
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
  tastePreview: {
    gap: spacing.xs,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.backgroundAlt,
  },
  tastePreviewLabel: {
    ...typography.strongMeta,
    color: colors.muted,
  },
  tastePreviewText: {
    ...typography.body,
    color: colors.text,
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
  numberField: {
    flex: 1,
    minWidth: 0,
  },
  numberFieldCompact: {
    flexBasis: "45%",
  },
  sessionFieldGrid: {
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
    backgroundColor: colors.primaryDark,
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
  sessionActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
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
  saveButton: {
    flex: 1,
    minHeight: layout.minTouchSize,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primaryDark,
  },
  saveButtonText: {
    ...typography.button,
    color: colors.textInverse,
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
    gap: spacing.sm,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    padding: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: colors.surface,
  },
  inputWarningNotice: {
    gap: spacing.xs,
    borderColor: colors.warning,
    borderRadius: radius.sm,
    borderWidth: 1,
    padding: spacing.md,
    backgroundColor: colors.backgroundAlt,
  },
  inputWarningTitle: {
    ...typography.label,
    color: colors.warning,
  },
  inputWarningDescription: {
    ...typography.meta,
    color: colors.text,
  },
  inputWarningItem: {
    ...typography.meta,
    color: colors.warning,
  },
  });
}
