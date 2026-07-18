import { Link, router, useLocalSearchParams } from "expo-router";
import {
  Archive,
  ChevronRight,
  ClipboardList,
  Coffee,
  History,
  Plus,
  RotateCcw,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type GestureResponderEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { BeanSession, RoastRange } from "../../domain/types";
import { createAutoBeanSession } from "../../storage/repository";
import { formatRoastRange, formatSessionStatus, roastRangeOptions } from "../formatters";
import { repository } from "../repository";
import {
  layout,
  radius,
  spacing,
  typography,
  useAppTheme,
  type AppColors,
} from "../theme";

interface SessionFormState {
  name: string;
  beanName: string;
  roaster: string;
  roastRange: RoastRange;
}

const initialSessionFormState: SessionFormState = {
  name: "",
  beanName: "",
  roaster: "",
  roastRange: "unknown",
};

export function SessionsScreen() {
  const params = useLocalSearchParams<{ editSessionId?: string | string[] }>();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(colors);
  const scrollRef = useRef<ScrollView>(null);
  const [sessions, setSessions] = useState<BeanSession[]>([]);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [sessionForm, setSessionForm] = useState<SessionFormState>(
    initialSessionFormState,
  );
  const [error, setError] = useState<string | undefined>();
  const [loadError, setLoadError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingSessionActionId, setPendingSessionActionId] = useState<
    string | undefined
  >();

  useEffect(() => {
    void loadSessions(getRouteEditSessionId(params.editSessionId));
  }, [params.editSessionId]);

  useEffect(() => {
    if (isEditorOpen) {
      scrollRef.current?.scrollTo({ animated: true, y: 0 });
    }
  }, [editingSessionId, isEditorOpen]);

  async function loadSessions(preferredEditSessionId?: string) {
    setIsLoading(true);
    setLoadError(undefined);
    try {
      const nextSessions = await repository.listSessions();
      setSessions(nextSessions);
      const preferredSession = preferredEditSessionId
        ? nextSessions.find((session) => session.id === preferredEditSessionId)
        : undefined;
      if (preferredSession) {
        handleEditSession(preferredSession);
      }
    } catch {
      setLoadError("세션 목록을 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSaveSession() {
    if (isSaving) {
      return;
    }

    setIsSaving(true);
    setError(undefined);
    try {
      const now = new Date().toISOString();
      const patch = sessionPatchFromForm(sessionForm, now);
      const savedSession = editingSessionId
        ? await repository.updateSession(editingSessionId, patch)
        : await repository.createSession({
            ...createAutoBeanSession({ now, roastProfile: patch.roastProfile }),
            name: patch.name,
            beanName: patch.beanName,
            roaster: patch.roaster,
          });
      setEditingSessionId(savedSession.id);
      setSessionForm(formFromSession(savedSession));
      setSessions(await repository.listSessions());
      setIsEditorOpen(false);
      clearEditSessionRoute();
    } catch {
      setError("세션을 저장하지 못했습니다. 다시 시도해주세요.");
    } finally {
      setIsSaving(false);
    }
  }

  function handleEditSession(session: BeanSession) {
    setEditingSessionId(session.id);
    setSessionForm(formFromSession(session));
    setError(undefined);
    setIsEditorOpen(true);
  }

  function handleNewSession() {
    setEditingSessionId(null);
    setSessionForm(initialSessionFormState);
    setError(undefined);
    setIsEditorOpen(true);
    clearEditSessionRoute();
  }

  function handleCloseEditor() {
    setEditingSessionId(null);
    setSessionForm(initialSessionFormState);
    setError(undefined);
    setIsEditorOpen(false);
    clearEditSessionRoute();
  }

  function clearEditSessionRoute() {
    if (getRouteEditSessionId(params.editSessionId)) {
      router.replace("/sessions");
    }
  }

  function handleUseSession(session: BeanSession) {
    if (session.status === "archived") {
      setError("보관된 세션은 진단에 사용할 수 없습니다. 먼저 복원하세요.");
      return;
    }
    router.push({ pathname: "/", params: { sessionId: session.id } });
  }

  function handleOpenSession(session: BeanSession) {
    router.push({ pathname: "/session/[sessionId]", params: { sessionId: session.id } });
  }

  async function handleArchiveSession(session: BeanSession) {
    await changeSessionStatus(session, "archive");
  }

  async function handleRestoreSession(session: BeanSession) {
    await changeSessionStatus(session, "restore");
  }

  async function changeSessionStatus(
    session: BeanSession,
    action: "archive" | "restore",
  ) {
    if (pendingSessionActionId) {
      return;
    }

    setPendingSessionActionId(session.id);
    setError(undefined);
    try {
      const changedSession =
        action === "archive"
          ? await repository.archiveSession(session.id)
          : await repository.restoreSession(session.id);
      if (editingSessionId === changedSession.id && changedSession.status === "archived") {
        handleCloseEditor();
      }
      setSessions(await repository.listSessions());
    } catch {
      setError(
        action === "archive"
          ? "세션을 보관하지 못했습니다. 다시 시도해주세요."
          : "세션을 복원하지 못했습니다. 다시 시도해주세요.",
      );
    } finally {
      setPendingSessionActionId(undefined);
    }
  }

  const activeSessions = sessions.filter((session) => session.status === "active");
  const archivedSessions = sessions.filter((session) => session.status === "archived");

  function renderSessionCard(session: BeanSession) {
    const isActive = session.status === "active";
    const isPending = pendingSessionActionId === session.id;

    return (
      <Pressable
        accessibilityLabel={`${session.name} 세션 상세`}
        accessibilityRole="link"
        key={session.id}
        onPress={() => handleOpenSession(session)}
        style={styles.card}
      >
        {isActive ? <View style={styles.activeBar} /> : null}
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
            {session.beanName ? `${session.beanName} · ` : ""}
            {formatRoastRange(session.roastProfile.range)}
          </Text>
          <Text selectable style={styles.mutedText}>
            최근 업데이트 {session.updatedAt.slice(0, 10)}
          </Text>
          <View style={styles.cardActions}>
            {isActive ? (
              <>
                <Pressable
                  accessibilityLabel={`${session.name} 진단에 사용`}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: isPending }}
                  disabled={isPending}
                  onPress={(event) => {
                    stopNestedCardAction(event);
                    handleUseSession(session);
                  }}
                  style={styles.smallDarkButton}
                >
                  <Text selectable style={styles.smallDarkButtonText}>
                    진단에 사용
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityLabel={`${session.name} 수정`}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: isPending }}
                  disabled={isPending}
                  onPress={(event) => {
                    stopNestedCardAction(event);
                    handleEditSession(session);
                  }}
                  style={styles.smallButton}
                >
                  <Text selectable style={styles.smallButtonText}>
                    수정
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityLabel={`${session.name} 보관`}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: isPending }}
                  disabled={isPending}
                  onPress={(event) => {
                    stopNestedCardAction(event);
                    void handleArchiveSession(session);
                  }}
                  style={styles.smallButton}
                >
                  <Archive color={colors.primary} size={14} strokeWidth={2} />
                  <Text selectable style={styles.smallButtonText}>
                    보관
                  </Text>
                </Pressable>
              </>
            ) : (
              <Pressable
                accessibilityLabel={`${session.name} 복원`}
                accessibilityRole="button"
                accessibilityState={{ disabled: isPending }}
                disabled={isPending}
                onPress={(event) => {
                  stopNestedCardAction(event);
                  void handleRestoreSession(session);
                }}
                style={styles.smallDarkButton}
              >
                <RotateCcw color={colors.textInverse} size={14} strokeWidth={2} />
                <Text selectable style={styles.smallDarkButtonText}>
                  복원
                </Text>
              </Pressable>
            )}
          </View>
        </View>
        <View style={styles.rowAction}>
          <ChevronRight color={colors.muted} size={18} strokeWidth={2} />
        </View>
      </Pressable>
    );
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      ref={scrollRef}
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: layout.scrollBottomPadding + insets.bottom },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.headerIdentity}>
          <View style={styles.headerIcon}>
            <ClipboardList color={colors.accent} size={18} strokeWidth={2} />
          </View>
          <View>
            <Text selectable style={styles.kicker}>
              세션
            </Text>
            <Text selectable style={styles.screenTitle}>
              원두 세션
            </Text>
          </View>
        </View>
        <Pressable
          accessibilityLabel="새 세션 만들기"
          accessibilityRole="button"
          onPress={handleNewSession}
          style={styles.smallDarkButton}
        >
          <Plus color={colors.textInverse} size={16} strokeWidth={2} />
          <Text selectable style={styles.smallDarkButtonText}>
            새 세션
          </Text>
        </Pressable>
      </View>

      {isLoading ? (
        <Text selectable style={styles.mutedText}>
          세션을 불러오는 중입니다.
        </Text>
      ) : null}

      {loadError ? (
        <View style={styles.errorPanel}>
          <Text selectable style={styles.errorText}>
            {loadError}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => void loadSessions(getRouteEditSessionId(params.editSessionId))}
            style={styles.secondaryButton}
          >
            <Text selectable style={styles.secondaryButtonText}>
              다시 시도
            </Text>
          </Pressable>
        </View>
      ) : null}

      {error ? (
        <Text selectable style={styles.errorText}>
          {error}
        </Text>
      ) : null}

      {isEditorOpen ? (
      <View style={styles.editorPanel}>
        <Text selectable style={styles.title}>
          {editingSessionId ? "세션 수정" : "새 세션"}
        </Text>
        <View style={styles.fieldGrid}>
          <SessionInput
            colors={colors}
            label="세션 이름"
            onChangeText={(name) => setSessionForm({ ...sessionForm, name })}
            placeholder="예: 과테말라 7월"
            styles={styles}
            value={sessionForm.name}
          />
          <SessionInput
            colors={colors}
            label="원두명"
            onChangeText={(beanName) => setSessionForm({ ...sessionForm, beanName })}
            placeholder="예: Guatemala Huehuetenango"
            styles={styles}
            value={sessionForm.beanName}
          />
          <SessionInput
            colors={colors}
            label="로스터"
            onChangeText={(roaster) => setSessionForm({ ...sessionForm, roaster })}
            placeholder="예: 동네 로스터리"
            styles={styles}
            value={sessionForm.roaster}
          />
        </View>
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
                  sessionForm.roastRange === option.value && styles.optionTextSelected,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.editorActions}>
          <Pressable
            accessibilityRole="button"
            onPress={handleCloseEditor}
            style={styles.secondaryButton}
          >
            <Text selectable style={styles.secondaryButtonText}>
              취소
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={isSaving}
            onPress={handleSaveSession}
            style={[styles.primaryButton, isSaving && styles.primaryButtonDisabled]}
          >
            <Coffee color={colors.textInverse} size={18} strokeWidth={2.1} />
            <Text selectable style={styles.primaryButtonText}>
              {isSaving ? "저장 중" : editingSessionId ? "수정 저장" : "세션 생성"}
            </Text>
          </Pressable>
        </View>
      </View>
      ) : null}

      {!isLoading && sessions.length === 0 ? (
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
      ) : sessions.length > 0 ? (
        <>
          {activeSessions.length > 0 ? (
            <View style={styles.sessionSection}>
              <Text selectable style={styles.sessionSectionTitle}>
                진행 중 세션
              </Text>
              {activeSessions.map(renderSessionCard)}
            </View>
          ) : null}
          {archivedSessions.length > 0 ? (
            <View style={styles.sessionSection}>
              <Text selectable style={styles.sessionSectionTitle}>
                보관된 세션
              </Text>
              {archivedSessions.map(renderSessionCard)}
            </View>
          ) : null}
        </>
      ) : null}
    </ScrollView>
  );
}

function stopNestedCardAction(event: GestureResponderEvent) {
  event.stopPropagation();
  event.preventDefault();
}

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
  kicker: {
    ...typography.strongMeta,
    color: colors.accent,
    textTransform: "uppercase",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  headerIdentity: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  screenTitle: {
    ...typography.screenTitle,
    color: colors.text,
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
  sessionSection: {
    gap: spacing.sm,
  },
  sessionSectionTitle: {
    ...typography.label,
    color: colors.text,
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
  editorPanel: {
    gap: spacing.md,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    padding: spacing.lg,
    backgroundColor: colors.surface,
  },
  fieldGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  field: {
    flex: 1,
    minWidth: 160,
    gap: spacing.xs,
  },
  label: {
    ...typography.label,
    color: colors.text,
  },
  input: {
    ...typography.body,
    minHeight: layout.minTouchSize,
    borderColor: colors.surfaceStrong,
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    color: colors.text,
    backgroundColor: colors.surface,
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
  editorActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
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
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primaryDark,
  },
  primaryButtonDisabled: {
    opacity: 0.65,
  },
  primaryButtonText: {
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
  errorText: {
    ...typography.label,
    color: colors.danger,
  },
  errorPanel: {
    gap: spacing.sm,
    alignItems: "flex-start",
  },
  cardActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  smallDarkButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    minHeight: 34,
    justifyContent: "center",
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primaryDark,
  },
  smallDarkButtonText: {
    ...typography.strongMeta,
    color: colors.textInverse,
  },
  smallButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    minHeight: 34,
    justifyContent: "center",
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  smallButtonText: {
    ...typography.strongMeta,
    color: colors.primary,
  },
  mutedText: {
    ...typography.meta,
    color: colors.muted,
  },
  });
}

function SessionInput({
  colors,
  label,
  onChangeText,
  placeholder,
  styles,
  value,
}: {
  colors: AppColors;
  label: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  styles: SessionsStyles;
  value: string;
}) {
  return (
    <View style={styles.field}>
      <Text selectable style={styles.label}>
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        onChangeText={onChangeText}
        style={styles.input}
        value={value}
      />
    </View>
  );
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
    roastProfile: {
      range: form.roastRange,
      confidence: form.roastRange === "unknown" ? "low" : "medium",
      source: "user_selected",
    } as const,
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

function getRouteEditSessionId(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

type SessionsStyles = ReturnType<typeof createStyles>;
