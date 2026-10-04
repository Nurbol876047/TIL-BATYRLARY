'use client';

import { useEffect, useState } from 'react';
import { useMediaPipeHands } from '@/hooks/hand/useMediaPipeHands';
import { useIsMobile } from '@/hooks/hand/useIsMobile';
import { useTolagaiExercise, type TolagaiCompleteHandler } from '@/hooks/tolagai/useTolagaiExercise';
import { useTolagaiHandController } from '@/hooks/tolagai/useTolagaiHandController';
import { useTolagaiStore } from '@/store/tolagaiStore';
import { CameraFeedOverlay } from '@/components/hand/CameraFeedOverlay';
import { FeedbackBanner } from '@/components/hand/FeedbackBanner';
import { TolagaiQuiz } from './TolagaiQuiz';

interface Props {
  onExerciseComplete?: TolagaiCompleteHandler;
}

/**
 * Квест «Толағай»: прямой квиз, рука наводится на ответ и щипком «жмёт»
 * его. Та же камера, что и в остальных упражнениях, но своё — гранёные
 * осколки скалы с трещинами силы вместо кувшинов или колец.
 */
function DesktopQuiz({ onExerciseComplete }: Props) {
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const hand = useMediaPipeHands(cameraEnabled);
  useTolagaiHandController(hand.status === 'tracking' || hand.status === 'no-hand' ? hand : null);
  const ex = useTolagaiExercise(onExerciseComplete);
  const feedback = useTolagaiStore((s) => s.feedback);
  const clearFeedback = useTolagaiStore((s) => s.clearFeedback);
  const setCameraStatus = useTolagaiStore((s) => s.setCameraStatus);

  useEffect(() => {
    setCameraStatus(hand.status);
  }, [hand.status, setCameraStatus]);

  return (
    <>
      <TolagaiQuiz
        current={ex.current}
        selectedIndex={ex.selectedIndex}
        answered={ex.answered}
        score={ex.score}
        streak={ex.streak}
        timeLeftMs={ex.timeLeftMs}
        timeLimitMs={60_000}
        correctCount={ex.correctCount}
        wrongCount={ex.wrongCount}
        totalWords={ex.totalWords}
        cameraStatus={hand.status}
        cameraError={hand.error}
        showCamera
        onToggleCamera={() => setCameraEnabled((v) => !v)}
        result={ex.roundState === 'finished' ? ex.lastResult : null}
        onRestart={ex.restart}
        onAnswer={ex.answer}
      />
      <CameraFeedOverlay hand={hand} />
      <FeedbackBanner feedback={feedback} onClear={clearFeedback} />
    </>
  );
}

function MobileQuiz({ onExerciseComplete }: Props) {
  const ex = useTolagaiExercise(onExerciseComplete);
  const feedback = useTolagaiStore((s) => s.feedback);
  const clearFeedback = useTolagaiStore((s) => s.clearFeedback);

  return (
    <>
      <TolagaiQuiz
        current={ex.current}
        selectedIndex={ex.selectedIndex}
        answered={ex.answered}
        score={ex.score}
        streak={ex.streak}
        timeLeftMs={ex.timeLeftMs}
        timeLimitMs={60_000}
        correctCount={ex.correctCount}
        wrongCount={ex.wrongCount}
        totalWords={ex.totalWords}
        cameraStatus="idle"
        cameraError={null}
        showCamera={false}
        onToggleCamera={() => undefined}
        result={ex.roundState === 'finished' ? ex.lastResult : null}
        onRestart={ex.restart}
        onAnswer={ex.answer}
      />
      <FeedbackBanner feedback={feedback} onClear={clearFeedback} />
    </>
  );
}

export function TolagaiExercise({ onExerciseComplete }: Props) {
  const isMobile = useIsMobile();

  if (isMobile === null) {
    return <div className="absolute inset-0 flex items-center justify-center text-white/40 text-sm">Жүктелуде…</div>;
  }
  return isMobile ? <MobileQuiz onExerciseComplete={onExerciseComplete} /> : <DesktopQuiz onExerciseComplete={onExerciseComplete} />;
}
