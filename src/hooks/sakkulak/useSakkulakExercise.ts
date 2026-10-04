'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useSakkulakStore, type SakkulakResult } from '@/store/sakkulakStore';

export type SakkulakCompleteHandler = (result: SakkulakResult) => void;
const TICK_MS = 250;

/** Жизненный цикл раунда квиза: старт, таймер, завершение, колбэк интеграции. */
export function useSakkulakExercise(onExerciseComplete?: SakkulakCompleteHandler) {
  const current = useSakkulakStore((s) => s.current);
  const selectedIndex = useSakkulakStore((s) => s.selectedIndex);
  const answered = useSakkulakStore((s) => s.answered);
  const roundState = useSakkulakStore((s) => s.roundState);
  const score = useSakkulakStore((s) => s.score);
  const streak = useSakkulakStore((s) => s.streak);
  const timeLeftMs = useSakkulakStore((s) => s.timeLeftMs);
  const correctCount = useSakkulakStore((s) => s.correctCount);
  const wrongCount = useSakkulakStore((s) => s.wrongCount);
  const totalWords = useSakkulakStore((s) => s.totalWords);
  const lastResult = useSakkulakStore((s) => s.lastResult);
  const startRound = useSakkulakStore((s) => s.startRound);
  const answerAction = useSakkulakStore((s) => s.answer);
  const onCompleteRef = useRef(onExerciseComplete);

  useEffect(() => {
    onCompleteRef.current = onExerciseComplete;
  }, [onExerciseComplete]);

  useEffect(() => {
    if (useSakkulakStore.getState().roundState === 'idle') startRound();
  }, [startRound]);

  useEffect(() => {
    if (roundState !== 'playing') return;
    const id = setInterval(() => useSakkulakStore.getState().tick(performance.now()), TICK_MS);
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
    lastResult,
    answer,
    restart,
  };
}
