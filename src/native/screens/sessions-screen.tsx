import { Link, router } from "expo-router";
import { ChevronRight, ClipboardList, Coffee, History } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type GestureResponderEvent,
} from "react-native";
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
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const [sessions, setSessions] = useState<BeanSession[]>([]);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [sessionForm, setSessionForm] = useState<SessionFormState>(
    initialSessionFormState,
  );
  const [error, setError] = useState<string | undefined>();
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    void loadSessions();
  }, []);

  async function loadSessions() {
    try {
      setSessions(await repository.listSessions());
    } catch {
      setError("세션 목록을 불러오지 못했습니다.");
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
  }

  function handleNewSession() {
    setEditingSessionId(null);
    setSessionForm(initialSessionFormState);
    setError(undefined);
  }

  function handleUseSession(session: BeanSession) {
    router.push({ pathname: "/", params: { sessionId: session.id } });
  }

  function handleOpenSession(session: BeanSession) {
    router.push({ pathname: "/session/[sessionId]", params: { sessionId: session.id } });
  }

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
              accessibilityRole="button"
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
        {error ? (
          <Text selectable style={styles.errorText}>
            {error}
          </Text>
        ) : null}
        <View style={styles.editorActions}>
          <Pressable accessibilityRole="button" onPress={handleNewSession} style={styles.secondaryButton}>
            <Text selectable style={styles.secondaryButtonText}>
              새로 입력
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
          <Pressable
            accessibilityRole="link"
            key={session.id}
            onPress={() => handleOpenSession(session)}
            style={styles.card}
          >
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
                {session.beanName ? `${session.beanName} · ` : ""}
                {formatRoastRange(session.roastProfile.range)}
              </Text>
              <Text selectable style={styles.mutedText}>
                최근 업데이트 {session.updatedAt.slice(0, 10)}
              </Text>
              <View style={styles.cardActions}>
                <Pressable
                  accessibilityRole="button"
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
                  accessibilityRole="button"
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
              </View>
            </View>
            <View style={styles.rowAction}>
              <ChevronRight color={colors.muted} size={18} strokeWidth={2} />
            </View>
          </Pressable>
        ))
      )}
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
  cardActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  smallDarkButton: {
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

type SessionsStyles = ReturnType<typeof createStyles>;
