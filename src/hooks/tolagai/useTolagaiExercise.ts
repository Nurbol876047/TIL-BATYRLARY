'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useTolagaiStore, type TolagaiResult } from '@/store/tolagaiStore';

export type TolagaiCompleteHandler = (result: TolagaiResult) => void;
const TICK_MS = 250;

/** Жизненный цикл раунда квиза: старт, таймер, завершение, колбэк интеграции. */
export function useTolagaiExercise(onExerciseComplete?: TolagaiCompleteHandler) {
  const current = useTolagaiStore((s) => s.current);
  const selectedIndex = useTolagaiStore((s) => s.selectedIndex);
  const answered = useTolagaiStore((s) => s.answered);
  const roundState = useTolagaiStore((s) => s.roundState);
  const score = useTolagaiStore((s) => s.score);
  const streak = useTolagaiStore((s) => s.streak);
  const timeLeftMs = useTolagaiStore((s) => s.timeLeftMs);
  const correctCount = useTolagaiStore((s) => s.correctCount);
  const wrongCount = useTolagaiStore((s) => s.wrongCount);
  const totalWords = useTolagaiStore((s) => s.totalWords);
  const lastResult = useTolagaiStore((s) => s.lastResult);
  const startRound = useTolagaiStore((s) => s.startRound);
  const answerAction = useTolagaiStore((s) => s.answer);
  const onCompleteRef = useRef(onExerciseComplete);

  useEffect(() => {
    onCompleteRef.current = onExerciseComplete;
  }, [onExerciseComplete]);

  useEffect(() => {
    if (useTolagaiStore.getState().roundState === 'idle') startRound();
  }, [startRound]);

  useEffect(() => {
    if (roundState !== 'playing') return;
    const id = setInterval(() => useTolagaiStore.getState().tick(performance.now()), TICK_MS);
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
