'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useTausogarStore, type TausogarResult } from '@/store/tausogarStore';

export type TausogarCompleteHandler = (result: TausogarResult) => void;
const TICK_MS = 250;

/** Жизненный цикл раунда квиза: старт, таймер, завершение, колбэк интеграции. */
export function useTausogarExercise(onExerciseComplete?: TausogarCompleteHandler) {
  const current = useTausogarStore((s) => s.current);
  const selectedIndex = useTausogarStore((s) => s.selectedIndex);
  const answered = useTausogarStore((s) => s.answered);
  const roundState = useTausogarStore((s) => s.roundState);
  const score = useTausogarStore((s) => s.score);
  const streak = useTausogarStore((s) => s.streak);
  const timeLeftMs = useTausogarStore((s) => s.timeLeftMs);
  const correctCount = useTausogarStore((s) => s.correctCount);
  const wrongCount = useTausogarStore((s) => s.wrongCount);
  const totalWords = useTausogarStore((s) => s.totalWords);
  const questionsDone = useTausogarStore((s) => s.questionsDone);
  const lastResult = useTausogarStore((s) => s.lastResult);
  const startRound = useTausogarStore((s) => s.startRound);
  const answerAction = useTausogarStore((s) => s.answer);
  const onCompleteRef = useRef(onExerciseComplete);

  useEffect(() => {
    onCompleteRef.current = onExerciseComplete;
  }, [onExerciseComplete]);

  useEffect(() => {
    if (useTausogarStore.getState().roundState === 'idle') startRound();
  }, [startRound]);

  useEffect(() => {
    if (roundState !== 'playing') return;
    const id = setInterval(() => useTausogarStore.getState().tick(performance.now()), TICK_MS);
    return () => clearInterval(id);
  }, [roundState]);

  useEffect(() => {
    if (roundState !== 'finished' || !lastResult) return;
    onCompleteRef.current?.(lastResult);
  }, [roundState, lastResult]);

  const answer = useCallback((optionIndex: number) => answerAction(optionIndex), [answerAction]);
  const restart = useCallback(() => startRound(), [startRound]);

  return {
    current,
    selectedIndex,
    answered,
    roundState,
    score,
    streak,
    timeLeftMs,
    correctCount,
    wrongCount,
    totalWords,
    questionsDone,
    lastResult,
    answer,
    restart,
  };
}
