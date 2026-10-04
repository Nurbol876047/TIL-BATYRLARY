'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useKoltausarStore, type KoltausarResult } from '@/store/koltausarStore';

export type KoltausarCompleteHandler = (result: KoltausarResult) => void;
const TICK_MS = 250;

/** Жизненный цикл раунда квиза: старт, таймер, завершение, колбэк интеграции. */
export function useKoltausarExercise(onExerciseComplete?: KoltausarCompleteHandler) {
  const current = useKoltausarStore((s) => s.current);
  const selectedIndex = useKoltausarStore((s) => s.selectedIndex);
  const answered = useKoltausarStore((s) => s.answered);
  const roundState = useKoltausarStore((s) => s.roundState);
  const score = useKoltausarStore((s) => s.score);
  const streak = useKoltausarStore((s) => s.streak);
  const timeLeftMs = useKoltausarStore((s) => s.timeLeftMs);
  const correctCount = useKoltausarStore((s) => s.correctCount);
  const wrongCount = useKoltausarStore((s) => s.wrongCount);
  const totalWords = useKoltausarStore((s) => s.totalWords);
  const lastResult = useKoltausarStore((s) => s.lastResult);
  const startRound = useKoltausarStore((s) => s.startRound);
  const answerAction = useKoltausarStore((s) => s.answer);
  const onCompleteRef = useRef(onExerciseComplete);

  useEffect(() => {
    onCompleteRef.current = onExerciseComplete;
  }, [onExerciseComplete]);

  useEffect(() => {
    if (useKoltausarStore.getState().roundState === 'idle') startRound();
  }, [startRound]);

  useEffect(() => {
    if (roundState !== 'playing') return;
    const id = setInterval(() => useKoltausarStore.getState().tick(performance.now()), TICK_MS);
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
