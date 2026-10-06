import { create } from 'zustand';
import { TAUSOGAR_QUESTIONS, shuffleItems, type TausogarCategory, type TausogarQuestion } from '@/lib/tausogar/items';
import type { HandTrackingStatus } from '@/hooks/hand/useMediaPipeHands';
import type { Feedback } from '@/lib/hand/types';

export interface TausogarOption {
  id: TausogarCategory;
  label: string;
}

/** Три кнопки-ответа choice-заданий — всегда в одном порядке */
export const TAUSOGAR_OPTIONS: readonly [TausogarOption, TausogarOption, TausogarOption] = [
  { id: 'declarative', label: 'Хабарлы сөйлем' },
  { id: 'interrogative', label: 'Сұраулы сөйлем' },
  { id: 'exclamatory', label: 'Лепті сөйлем' },
];

export interface TausogarResult {
  correct: number;
  wrong: number;
  score: number;
  timeSpentMs: number;
  passed: boolean;
}

export const ROUND_TIME_MS = 60_000;
export const PASS_RATIO = 0.8;
/** Штраф таймера за неверную пару в match-задании */
export const MATCH_WRONG_PENALTY_MS = 3_000;
/** Пауза перед следующим вопросом после завершения match-задания */
export const MATCH_COMPLETE_DELAY_MS = 1_500;
/** Пауза «показать правильные пары», когда время истекло посреди match-задания */
export const MATCH_REVEAL_DELAY_MS = 1_200;

interface TausogarState {
  queue: TausogarQuestion[];
  current: TausogarQuestion | null;
  selectedIndex: number | null;
  answered: boolean;
  roundState: 'idle' | 'playing' | 'finished';
  roundStartedAt: number;
  timeLimitMs: number;
  timeLeftMs: number;
  /** Накопленный штраф за ошибки в match-заданиях — тик вычитает его из расчётного времени */
  penaltyMs: number;
  /** Все настоящие пары текущего match-задания собраны (или время вышло и пары раскрыты) */
  matchResolved: boolean;
  /** Идёт показ правильных пар после истечения таймера — tick() ждёт, не завершает раунд сам */
  revealing: boolean;
  score: number;
  streak: number;
  correctCount: number;
  wrongCount: number;
  totalWords: number;
  /** Сколько вопросов (choice- или match-) уже пройдено — для счётчика прогресса */
  questionsDone: number;
  lastResult: TausogarResult | null;

  cursor: { x: number; y: number; visible: boolean; pinching: boolean };
  hoverOption: number | null;
  cameraStatus: HandTrackingStatus;
  feedback: Feedback | null;

  startRound: () => void;
  /** Ответ в choice-задании */
  answer: (optionIndex: number) => void;
  /** Верная пара в match-задании */
  matchCorrectPair: () => void;
  /** Неверная попытка пары в match-задании */
  matchWrongAttempt: () => void;
  /** Все настоящие пары собраны — переход к следующему вопросу */
  completeMatch: () => void;
  /** Время истекло посреди match-задания — показать ответы и завершить раунд */
  revealTimeoutThenFinish: () => void;
  spawnNext: () => void;
  finishRound: () => void;
  tick: (now: number) => void;
  setCursor: (c: Partial<TausogarState['cursor']>) => void;
  setHoverOption: (i: number | null) => void;
  setCameraStatus: (s: HandTrackingStatus) => void;
  clearFeedback: (id: number) => void;
}

let feedbackSeq = 0;

export const useTausogarStore = create<TausogarState>((set, get) => ({
  queue: [],
  current: null,
  selectedIndex: null,
  answered: false,
  roundState: 'idle',
  roundStartedAt: 0,
  timeLimitMs: ROUND_TIME_MS,
  timeLeftMs: ROUND_TIME_MS,
  penaltyMs: 0,
  matchResolved: false,
  revealing: false,
  score: 0,
  streak: 0,
  correctCount: 0,
  wrongCount: 0,
  totalWords: 0,
  questionsDone: 0,
  lastResult: null,

  cursor: { x: 0.5, y: 0.5, visible: false, pinching: false },
  hoverOption: null,
  cameraStatus: 'idle',
  feedback: null,

  startRound: () => {
    const queue = shuffleItems(TAUSOGAR_QUESTIONS);
    set({
      queue,
      current: null,
      selectedIndex: null,
      answered: false,
      roundState: 'playing',
      roundStartedAt: performance.now(),
      timeLeftMs: get().timeLimitMs,
      penaltyMs: 0,
      matchResolved: false,
      revealing: false,
      score: 0,
      streak: 0,
      correctCount: 0,
      wrongCount: 0,
      totalWords: queue.length,
      questionsDone: 0,
      lastResult: null,
      feedback: null,
      hoverOption: null,
    });
    get().spawnNext();
  },

  spawnNext: () => {
    const { queue, roundState } = get();
    if (roundState !== 'playing') return;
    if (queue.length === 0) {
      get().finishRound();
      return;
    }
    const [next, ...rest] = queue;
    set({ queue: rest, current: next, selectedIndex: null, answered: false, matchResolved: false });
  },

  answer: (optionIndex) => {
    const s = get();
    if (s.roundState !== 'playing' || s.answered || !s.current || s.current.type !== 'choice') return;
    const correct = s.current.category === TAUSOGAR_OPTIONS[optionIndex].id;
    if (correct) {
      set({
        answered: true,
        selectedIndex: optionIndex,
        score: s.score + 10,
        streak: s.streak + 1,
        correctCount: s.correctCount + 1,
        feedback: { kind: 'correct', text: 'Дұрыс! +10', id: ++feedbackSeq },
      });
    } else {
      set({
        answered: true,
        selectedIndex: optionIndex,
        score: Math.max(0, s.score - 5),
        streak: 0,
        wrongCount: s.wrongCount + 1,
        feedback: { kind: 'wrong', text: `«${s.current.text}» — ${TAUSOGAR_OPTIONS[optionIndex].label} емес. ${s.current.hint}`, id: ++feedbackSeq },
      });
    }
    setTimeout(() => {
      set((st) => ({ questionsDone: st.questionsDone + 1 }));
      get().spawnNext();
    }, 900);
  },

  matchCorrectPair: () => {
    set((s) => ({
      score: s.score + 10,
      streak: s.streak + 1,
      correctCount: s.correctCount + 1,
      feedback: { kind: 'correct', text: 'Дұрыс жұп! +10', id: ++feedbackSeq },
    }));
  },

  matchWrongAttempt: () => {
    set((s) => ({
      score: Math.max(0, s.score - 5),
      streak: 0,
      wrongCount: s.wrongCount + 1,
      penaltyMs: s.penaltyMs + MATCH_WRONG_PENALTY_MS,
      feedback: { kind: 'wrong', text: 'Қате жұп!', id: ++feedbackSeq },
    }));
  },

  completeMatch: () => {
    set((s) => ({ matchResolved: true, questionsDone: s.questionsDone + 1 }));
    setTimeout(() => get().spawnNext(), MATCH_COMPLETE_DELAY_MS);
  },

  revealTimeoutThenFinish: () => {
    const s = get();
    if (s.matchResolved || s.revealing) return;
    set((st) => ({ revealing: true, questionsDone: st.questionsDone + 1 }));
    setTimeout(() => {
      set({ matchResolved: true, revealing: false });
      get().finishRound();
    }, MATCH_REVEAL_DELAY_MS);
  },

  finishRound: () => {
    const s = get();
    if (s.roundState !== 'playing') return;
    const passed = s.correctCount / Math.max(1, s.totalWords) >= PASS_RATIO;
    set({
      roundState: 'finished',
      lastResult: {
        correct: s.correctCount,
        wrong: s.wrongCount,
        score: s.score,
        timeSpentMs: s.timeLimitMs - s.timeLeftMs,
        passed,
      },
    });
  },

  tick: (now) => {
    const s = get();
    if (s.roundState !== 'playing') return;
    const left = Math.max(0, s.timeLimitMs - (now - s.roundStartedAt) - s.penaltyMs);
    set({ timeLeftMs: left });
    if (left <= 0 && !s.revealing) {
      // Посреди match-задания сначала даём показать правильные пары —
      // MatchTask сам вызовет revealTimeoutThenFinish(), а раунд завершит
      // её собственный таймер, не этот tick (иначе получится гонка)
      if (s.current?.type === 'match' && !s.matchResolved) return;
      get().finishRound();
    }
  },

  setCursor: (c) => set((s) => ({ cursor: { ...s.cursor, ...c } })),
  setHoverOption: (i) => set({ hoverOption: i }),
  setCameraStatus: (cameraStatus) => set({ cameraStatus }),
  clearFeedback: (id) => set((s) => (s.feedback?.id === id ? { feedback: null } : {})),
}));
