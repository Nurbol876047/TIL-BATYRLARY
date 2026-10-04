'use client';

import { useEffect, useState } from 'react';
import { useMediaPipeHands } from '@/hooks/hand/useMediaPipeHands';
import { useIsMobile } from '@/hooks/hand/useIsMobile';
import { useKoltausarExercise, type KoltausarCompleteHandler } from '@/hooks/koltausar/useKoltausarExercise';
import { useKoltausarHandController } from '@/hooks/koltausar/useKoltausarHandController';
import { useKoltausarStore } from '@/store/koltausarStore';
import { CameraFeedOverlay } from '@/components/hand/CameraFeedOverlay';
import { FeedbackBanner } from '@/components/hand/FeedbackBanner';
import { KoltausarQuiz } from './KoltausarQuiz';

interface Props {
  onExerciseComplete?: KoltausarCompleteHandler;
}

/**
 * Квест «Қолтаусар»: никаких корзин и перетаскивания — прямой квиз.
 * Рука наводится на нужный ответ и щипком «жмёт» его, как кнопку; на
 * мобильных и без камеры — обычный тап/клик. Та же камера, что и в
 * остальных упражнениях, но интерфейс выбора — свой, press-to-answer.
 */
function DesktopQuiz({ onExerciseComplete }: Props) {
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const hand = useMediaPipeHands(cameraEnabled);
  useKoltausarHandController(hand.status === 'tracking' || hand.status === 'no-hand' ? hand : null);
  const ex = useKoltausarExercise(onExerciseComplete);
  const feedback = useKoltausarStore((s) => s.feedback);
  const clearFeedback = useKoltausarStore((s) => s.clearFeedback);
  const setCameraStatus = useKoltausarStore((s) => s.setCameraStatus);

  useEffect(() => {
    setCameraStatus(hand.status);
  }, [hand.status, setCameraStatus]);

  return (
    <>
      <KoltausarQuiz
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
  const ex = useKoltausarExercise(onExerciseComplete);
  const feedback = useKoltausarStore((s) => s.feedback);
  const clearFeedback = useKoltausarStore((s) => s.clearFeedback);

  return (
    <>
      <KoltausarQuiz
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

export function KoltausarExercise({ onExerciseComplete }: Props) {
  const isMobile = useIsMobile();

  if (isMobile === null) {
    return <div className="absolute inset-0 flex items-center justify-center text-white/40 text-sm">Жүктелуде…</div>;
  }
  return isMobile ? <MobileQuiz onExerciseComplete={onExerciseComplete} /> : <DesktopQuiz onExerciseComplete={onExerciseComplete} />;
}
