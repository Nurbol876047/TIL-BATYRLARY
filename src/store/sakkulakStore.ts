import { create } from 'zustand';
import { SAKKULAK_ITEMS, shuffleItems, type SakkulakCategory, type SakkulakItem } from '@/lib/sakkulak/items';
import type { HandTrackingStatus } from '@/hooks/hand/useMediaPipeHands';
import type { Feedback } from '@/lib/hand/types';

export interface SakkulakOption {
  id: SakkulakCategory;
  label: string;
}

/** Три кнопки-ответа — всегда в одном порядке, меняется только утверждение сверху */
export const SAKKULAK_OPTIONS: readonly [SakkulakOption, SakkulakOption, SakkulakOption] = [
  { id: 'present', label: 'Осы шақ' },
  { id: 'past', label: 'Өткен шақ' },
  { id: 'future', label: 'Келер шақ' },
];

export interface SakkulakResult {
  correct: number;
  wrong: number;
  score: number;
  timeSpentMs: number;
  passed: boolean;
}

export const ROUND_TIME_MS = 60_000;
export const PASS_RATIO = 0.8;

interface SakkulakState {
  queue: SakkulakItem[];
  current: SakkulakItem | null;
  selectedIndex: number | null;
  answered: boolean;
  roundState: 'idle' | 'playing' | 'finished';
  roundStartedAt: number;
  timeLimitMs: number;
  timeLeftMs: number;
  score: number;
  streak: number;
  correctCount: number;
  wrongCount: number;
  totalWords: number;
  lastResult: SakkulakResult | null;

  cursor: { x: number; y: number; visible: boolean; pinching: boolean };
  hoverOption: number | null;
  cameraStatus: HandTrackingStatus;
  feedback: Feedback | null;

  startRound: () => void;
  answer: (optionIndex: number) => void;
  spawnNext: () => void;
  finishRound: () => void;
  tick: (now: number) => void;
  setCursor: (c: Partial<SakkulakState['cursor']>) => void;
  setHoverOption: (i: number | null) => void;
  setCameraStatus: (s: HandTrackingStatus) => void;
  clearFeedback: (id: number) => void;
}

let feedbackSeq = 0;

export const useSakkulakStore = create<SakkulakState>((set, get) => ({
  queue: [],
  current: null,
  selectedIndex: null,
  answered: false,
  roundState: 'idle',
  roundStartedAt: 0,
  timeLimitMs: ROUND_TIME_MS,
  timeLeftMs: ROUND_TIME_MS,
  score: 0,
  streak: 0,
  correctCount: 0,
  wrongCount: 0,
  totalWords: 0,
  lastResult: null,

  cursor: { x: 0.5, y: 0.5, visible: false, pinching: false },
  hoverOption: null,
  cameraStatus: 'idle',
  feedback: null,

  startRound: () => {
    const queue = shuffleItems(SAKKULAK_ITEMS);
    set({
      queue,
      current: null,
      selectedIndex: null,
      answered: false,
      roundState: 'playing',
      roundStartedAt: performance.now(),
      timeLeftMs: get().timeLimitMs,
      score: 0,
      streak: 0,
      correctCount: 0,
      wrongCount: 0,
      totalWords: queue.length,
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
    set({ queue: rest, current: next, selectedIndex: null, answered: false });
  },

  answer: (optionIndex) => {
    const s = get();
    if (s.roundState !== 'playing' || s.answered || !s.current) return;
    const correct = s.current.category === SAKKULAK_OPTIONS[optionIndex].id;
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
        feedback: { kind: 'wrong', text: `«${s.current.text}» — ${SAKKULAK_OPTIONS[optionIndex].label} емес. ${s.current.hint}`, id: ++feedbackSeq },
      });
    }
    setTimeout(() => get().spawnNext(), 900);
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
    const left = Math.max(0, s.timeLimitMs - (now - s.roundStartedAt));
    set({ timeLeftMs: left });
    if (left <= 0) get().finishRound();
  },

  setCursor: (c) => set((s) => ({ cursor: { ...s.cursor, ...c } })),
  setHoverOption: (i) => set({ hoverOption: i }),
  setCameraStatus: (cameraStatus) => set({ cameraStatus }),
  clearFeedback: (id) => set((s) => (s.feedback?.id === id ? { feedback: null } : {})),
}));
