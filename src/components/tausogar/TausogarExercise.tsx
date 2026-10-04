'use client';

import { useEffect, useState } from 'react';
import { useMediaPipeHands } from '@/hooks/hand/useMediaPipeHands';
import { useIsMobile } from '@/hooks/hand/useIsMobile';
import { useTausogarExercise, type TausogarCompleteHandler } from '@/hooks/tausogar/useTausogarExercise';
import { useTausogarHandController } from '@/hooks/tausogar/useTausogarHandController';
import { useTausogarStore } from '@/store/tausogarStore';
import { CameraFeedOverlay } from '@/components/hand/CameraFeedOverlay';
import { FeedbackBanner } from '@/components/hand/FeedbackBanner';
import { TausogarQuiz } from './TausogarQuiz';

interface Props {
  onExerciseComplete?: TausogarCompleteHandler;
}

/**
 * Квест «Таусоғар»: прямой квиз (щипок = жми ответ) для choice-заданий и
 * задание на сопоставление (щипок = перетащи карточку) для match-заданий —
 * у match-заданий свой движок жеста (usePinchDrag внутри MatchTask), поэтому
 * обычный «укажи и нажми» контроллер на это время отключается.
 */
function DesktopQuiz({ onExerciseComplete }: Props) {
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const hand = useMediaPipeHands(cameraEnabled);
  const isMatch = useTausogarStore((s) => s.current?.type === 'match');
  useTausogarHandController(!isMatch && (hand.status === 'tracking' || hand.status === 'no-hand') ? hand : null);
  const ex = useTausogarExercise(onExerciseComplete);
  const feedback = useTausogarStore((s) => s.feedback);
  const clearFeedback = useTausogarStore((s) => s.clearFeedback);
  const setCameraStatus = useTausogarStore((s) => s.setCameraStatus);

  useEffect(() => {
    setCameraStatus(hand.status);
  }, [hand.status, setCameraStatus]);

  return (
    <>
      <TausogarQuiz
        current={ex.current}
        selectedIndex={ex.selectedIndex}
        answered={ex.answered}
        score={ex.score}
        streak={ex.streak}
        timeLeftMs={ex.timeLeftMs}
        timeLimitMs={60_000}
        questionsDone={ex.questionsDone}
        totalWords={ex.totalWords}
        cameraStatus={hand.status}
        cameraError={hand.error}
        showCamera
        onToggleCamera={() => setCameraEnabled((v) => !v)}
        result={ex.roundState === 'finished' ? ex.lastResult : null}
        onRestart={ex.restart}
        onAnswer={ex.answer}
        hand={hand.status === 'tracking' || hand.status === 'no-hand' ? hand : null}
      />
      <CameraFeedOverlay hand={hand} />
      <FeedbackBanner feedback={feedback} onClear={clearFeedback} />
    </>
  );
}

function MobileQuiz({ onExerciseComplete }: Props) {
  const ex = useTausogarExercise(onExerciseComplete);
  const feedback = useTausogarStore((s) => s.feedback);
  const clearFeedback = useTausogarStore((s) => s.clearFeedback);

  return (
    <>
      <TausogarQuiz
        current={ex.current}
        selectedIndex={ex.selectedIndex}
        answered={ex.answered}
        score={ex.score}
        streak={ex.streak}
        timeLeftMs={ex.timeLeftMs}
        timeLimitMs={60_000}
        questionsDone={ex.questionsDone}
        totalWords={ex.totalWords}
        cameraStatus="idle"
        cameraError={null}
        showCamera={false}
        onToggleCamera={() => undefined}
        result={ex.roundState === 'finished' ? ex.lastResult : null}
        onRestart={ex.restart}
        onAnswer={ex.answer}
        hand={null}
      />
      <FeedbackBanner feedback={feedback} onClear={clearFeedback} />
    </>
  );
}

export function TausogarExercise({ onExerciseComplete }: Props) {
  const isMobile = useIsMobile();

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      (window as unknown as { __tausogarStore?: typeof useTausogarStore }).__tausogarStore = useTausogarStore;
    }
  }, []);

  if (isMobile === null) {
    return <div className="absolute inset-0 flex items-center justify-center text-white/40 text-sm">Жүктелуде…</div>;
  }
  return isMobile ? <MobileQuiz onExerciseComplete={onExerciseComplete} /> : <DesktopQuiz onExerciseComplete={onExerciseComplete} />;
}
