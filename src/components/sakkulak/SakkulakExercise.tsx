'use client';

import { useEffect, useState } from 'react';
import { useMediaPipeHands } from '@/hooks/hand/useMediaPipeHands';
import { useIsMobile } from '@/hooks/hand/useIsMobile';
import { useSakkulakExercise, type SakkulakCompleteHandler } from '@/hooks/sakkulak/useSakkulakExercise';
import { useSakkulakHandController } from '@/hooks/sakkulak/useSakkulakHandController';
import { useSakkulakStore } from '@/store/sakkulakStore';
import { CameraFeedOverlay } from '@/components/hand/CameraFeedOverlay';
import { FeedbackBanner } from '@/components/hand/FeedbackBanner';
import { SakkulakQuiz } from './SakkulakQuiz';

interface Props {
  onExerciseComplete?: SakkulakCompleteHandler;
}

/**
 * Квест «Саққұлақ»: прямой квиз, рука наводится на ответ и щипком «жмёт»
 * его. Та же камера, что и в остальных упражнениях, но своё звуковое
 * оформление (кольца вокруг уха) вместо кувшинов или идолов.
 */
function DesktopQuiz({ onExerciseComplete }: Props) {
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const hand = useMediaPipeHands(cameraEnabled);
  useSakkulakHandController(hand.status === 'tracking' || hand.status === 'no-hand' ? hand : null);
  const ex = useSakkulakExercise(onExerciseComplete);
  const feedback = useSakkulakStore((s) => s.feedback);
  const clearFeedback = useSakkulakStore((s) => s.clearFeedback);
  const setCameraStatus = useSakkulakStore((s) => s.setCameraStatus);

  useEffect(() => {
    setCameraStatus(hand.status);
  }, [hand.status, setCameraStatus]);

  return (
    <>
      <SakkulakQuiz
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
  const ex = useSakkulakExercise(onExerciseComplete);
  const feedback = useSakkulakStore((s) => s.feedback);
  const clearFeedback = useSakkulakStore((s) => s.clearFeedback);

  return (
    <>
      <SakkulakQuiz
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

export function SakkulakExercise({ onExerciseComplete }: Props) {
  const isMobile = useIsMobile();

  if (isMobile === null) {
    return <div className="absolute inset-0 flex items-center justify-center text-white/40 text-sm">Жүктелуде…</div>;
  }
  return isMobile ? <MobileQuiz onExerciseComplete={onExerciseComplete} /> : <DesktopQuiz onExerciseComplete={onExerciseComplete} />;
}
