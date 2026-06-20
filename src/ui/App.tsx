import { FormEvent, useMemo, useState } from "react";
import { buildRecommendation } from "../domain/recommendation";
import {
  buildExtraction,
  deriveBasicObservation,
  validateQuickDiagnosisInput,
} from "../domain/quickDiagnosis";
import { parseTasteDescription } from "../domain/taste";
import type {
  BeanSession,
  PrepObservationId,
  RecommendationResult,
  ShotChange,
  ShotChangeDirection,
  ShotChangeVariable,
  ShotRecord,
} from "../domain/types";
import { createAutoBeanSession, createIndexedDbRepository } from "../storage/repository";
import styles from "./App.module.css";

interface FormState {
  tasteDescription: string;
  doseGrams: string;
  yieldGrams: string;
  brewSeconds: string;
  grindNote: string;
  prepObservations: PrepObservationId[];
  changedVariable: "none" | "unknown" | ShotChangeVariable;
  changeDirection: ShotChangeDirection;
  changeAmountLabel: "none" | "one_small_step" | "small" | "next_shot_observation";
  changeNote: string;
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
  changeAmountLabel: "none",
  changeNote: "",
};

const prepOptions: Array<{ id: PrepObservationId; label: string }> = [
  { id: "no_issue_observed", label: "이상한 점은 없었다" },
  { id: "one_sided_flow", label: "한쪽으로만 흘렀다" },
  { id: "spurting_or_spraying", label: "포터필터에서 튀거나 샜다" },
  { id: "sudden_flow_acceleration", label: "흐름이 갑자기 빨라졌다" },
  { id: "cracked_puck", label: "퍽이 갈라졌다" },
  { id: "uneven_puck_surface", label: "퍽 표면이 고르지 않았다" },
  { id: "soupy_puck", label: "퍽이 질척했다" },
  { id: "tilted_tamp", label: "탬핑이 기울어진 것 같다" },
  { id: "uneven_distribution", label: "분배가 고르지 않았다" },
  { id: "not_sure", label: "잘 모르겠다" },
];

const warningCopy: Record<string, string> = {
  dose_out_of_common_range: "도징량이 일반적인 에스프레소 범위를 벗어났을 수 있습니다.",
  yield_out_of_common_range: "추출량이 일반적인 에스프레소 범위를 벗어났을 수 있습니다.",
  time_out_of_common_range: "추출 시간이 일반적인 진단 범위를 벗어났을 수 있습니다.",
  ratio_out_of_common_range: "도징량 대비 추출량이 커서 추천의 불확실성이 높아집니다.",
};

export function App() {
  const repository = useMemo(() => createIndexedDbRepository(), []);
  const [form, setForm] = useState<FormState>(initialFormState);
  const [activeSession, setActiveSession] = useState<BeanSession | null>(null);
  const [shots, setShots] = useState<ShotRecord[]>([]);
  const [result, setResult] = useState<RecommendationResult | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

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

    const nextShots = await repository.listShots(session.id);
    setActiveSession(session);
    setShots(nextShots);
    setResult(savedShot.recommendation);
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
    <main className={styles.appShell}>
      <section className={styles.workspace} aria-labelledby="app-title">
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>Espresso Coach</p>
            <h1 id="app-title">빠른 진단</h1>
          </div>
          <button className={styles.primaryButton} form="quick-diagnosis" type="submit">
            추천 받기
          </button>
        </header>

        <form id="quick-diagnosis" className={styles.quickForm} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span>맛</span>
            <textarea
              rows={3}
              placeholder="예: 시고 끝맛이 떫다"
              value={form.tasteDescription}
              onChange={(event) =>
                setForm({ ...form, tasteDescription: event.target.value })
              }
            />
            {errors.tasteDescription ? (
              <small className={styles.errorText}>{errors.tasteDescription}</small>
            ) : null}
          </label>

          <div className={styles.numberGrid}>
            <label className={styles.field}>
              <span>도징량</span>
              <div className={styles.unitInput}>
                <input
                  inputMode="decimal"
                  placeholder="18.0"
                  value={form.doseGrams}
                  onChange={(event) => setForm({ ...form, doseGrams: event.target.value })}
                />
                <span>g</span>
              </div>
              {errors.doseGrams ? (
                <small className={styles.errorText}>{errors.doseGrams}</small>
              ) : null}
            </label>
            <label className={styles.field}>
              <span>추출량</span>
              <div className={styles.unitInput}>
                <input
                  inputMode="decimal"
                  placeholder="36.0"
                  value={form.yieldGrams}
                  onChange={(event) =>
                    setForm({ ...form, yieldGrams: event.target.value })
                  }
                />
                <span>g</span>
              </div>
              {errors.yieldGrams ? (
                <small className={styles.errorText}>{errors.yieldGrams}</small>
              ) : null}
            </label>
            <label className={styles.field}>
              <span>시간</span>
              <div className={styles.unitInput}>
                <input
                  inputMode="decimal"
                  placeholder="28"
                  value={form.brewSeconds}
                  onChange={(event) =>
                    setForm({ ...form, brewSeconds: event.target.value })
                  }
                />
                <span>s</span>
              </div>
              {errors.brewSeconds ? (
                <small className={styles.errorText}>{errors.brewSeconds}</small>
              ) : null}
            </label>
          </div>

          <label className={styles.field}>
            <span>분쇄도 메모</span>
            <input
              placeholder="예: 18 클릭"
              value={form.grindNote}
              onChange={(event) => setForm({ ...form, grindNote: event.target.value })}
            />
          </label>

          <fieldset className={styles.optionGroup}>
            <legend>퍽/흐름</legend>
            <div className={styles.optionGrid}>
              {prepOptions.map((option) => (
                <label className={styles.checkboxLabel} key={option.id}>
                  <input
                    type="checkbox"
                    checked={form.prepObservations.includes(option.id)}
                    onChange={() => togglePrepObservation(option.id)}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className={styles.changeGroup}>
            <legend>직전 샷 변경</legend>
            <select
              value={form.changedVariable}
              onChange={(event) =>
                setForm({
                  ...form,
                  changedVariable: event.target.value as FormState["changedVariable"],
                })
              }
            >
              <option value="none">변경 없음</option>
              <option value="unknown">모름</option>
              <option value="grind_size">분쇄도</option>
              <option value="dose">도징량</option>
              <option value="yield">추출량</option>
              <option value="distribution">분배</option>
              <option value="tamping_consistency">탬핑</option>
              <option value="puck_prep">퍽 준비</option>
            </select>
            <select
              value={form.changeDirection}
              onChange={(event) =>
                setForm({
                  ...form,
                  changeDirection: event.target.value as ShotChangeDirection,
                })
              }
            >
              <option value="unknown">방향 모름</option>
              <option value="finer">더 곱게</option>
              <option value="coarser">더 굵게</option>
              <option value="increase">늘림</option>
              <option value="decrease">줄임</option>
              <option value="changed">바꿈</option>
            </select>
          </fieldset>
        </form>

        <aside className={styles.history} aria-label="최근 샷">
          <div className={styles.sectionHeader}>
            <h2>{result ? "추천 결과" : "최근 샷"}</h2>
          </div>
          {result ? (
            <article className={styles.resultPanel}>
              <p className={styles.resultLabel}>다음 샷</p>
              <h3>{result.primary.message}</h3>
              <ul>
                {result.rationale.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              {shots.at(-1)?.extraction.inputWarnings.length ? (
                <div className={styles.warningList}>
                  {shots
                    .at(-1)
                    ?.extraction.inputWarnings.map((warning) => (
                      <p key={warning}>{warningCopy[warning]}</p>
                    ))}
                </div>
              ) : null}
            </article>
          ) : (
            <div className={styles.emptyState}>기록된 샷이 없습니다.</div>
          )}
          {shots.length > 0 ? (
            <div className={styles.shotList}>
              {shots.map((shot) => (
              <article className={styles.shotCard} key={shot.id}>
                <div>
                  <strong>Shot {shot.shotNumber.toString().padStart(2, "0")}</strong>
                  <p>{shot.extraction.tasteDescription}</p>
                </div>
                <dl>
                  <div>
                    <dt>비율</dt>
                    <dd>1:{shot.extraction.brewRatio.toFixed(1)}</dd>
                  </div>
                  <div>
                    <dt>시간</dt>
                    <dd>{shot.extraction.brewSeconds}s</dd>
                  </div>
                </dl>
              </article>
              ))}
            </div>
          ) : null}
        </aside>
      </section>
    </main>
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
      ...(form.changeAmountLabel !== "none"
        ? { amountLabel: form.changeAmountLabel }
        : {}),
      ...(form.changeNote.trim() ? { note: form.changeNote.trim() } : {}),
    },
  ];
}

function createId(prefix: "shot"): string {
  if (globalThis.crypto?.randomUUID) {
    return `${prefix}_${globalThis.crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now().toString(36)}`;
}
