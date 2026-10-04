'use client';

import { useEffect, useState } from 'react';
import { useMediaPipeHands } from '@/hooks/hand/useMediaPipeHands';
import { useIsMobile } from '@/hooks/hand/useIsMobile';
import { useSortExercise, type SortCompleteHandler } from '@/hooks/sort-words/useSortExercise';
import { useSortWordsStore } from '@/store/sortWordsStore';
import { CameraFeedOverlay } from '@/components/hand/CameraFeedOverlay';
import { FeedbackBanner } from '@/components/hand/FeedbackBanner';
import { ZhelayakScene } from './ZhelayakScene';
import { ZhelayakHUD } from './ZhelayakHUD';
import { MobileZhelayak } from './MobileZhelayak';

interface Props {
  /** Точка интеграции с общим прогрессом платформы Lingova */
  onExerciseComplete?: SortCompleteHandler;
}

const ZHELAYAK_SET_ID = 'zhelayak-legend';

function useSharedHud(onExerciseComplete?: SortCompleteHandler) {
  const ex = useSortExercise(onExerciseComplete, ZHELAYAK_SET_ID);
  const feedback = useSortWordsStore((s) => s.feedback);
  const clearFeedback = useSortWordsStore((s) => s.clearFeedback);
  const controlMode = useSortWordsStore((s) => s.controlMode);
  const setControlMode = useSortWordsStore((s) => s.setControlMode);
  const timeLimitMs = useSortWordsStore((s) => s.timeLimitMs);
  const bestTimeMs = useSortWordsStore((s) => s.bestTimeMs);
  const hardMode = useSortWordsStore((s) => s.hardMode);
  const setHardMode = useSortWordsStore((s) => s.setHardMode);
  // Прогресс — не по общему банку наборов (он общий с Sort the Words),
  // а по тому, пройден ли именно этот квест про Желаяка
  const questMastered = useSortWordsStore((s) => (s.masteredSets.includes(ZHELAYAK_SET_ID) ? 1 : 0));
  return { ex, feedback, clearFeedback, controlMode, setControlMode, timeLimitMs, bestTimeMs, hardMode, setHardMode, questMastered };
}

/** Квест «Желаяқ»: та же рабочая камера/жесты, что и в Sort the Words, но
 * полностью другая сцена — степные идолы-балбалы вместо корзин, стрела
 * с посланием вместо плитки, и отдельный, не похожий на остальные HUD. */
function DesktopQuest({ onExerciseComplete }: Props) {
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const hand = useMediaPipeHands(cameraEnabled);
  const { ex, feedback, clearFeedback, controlMode, setControlMode, timeLimitMs, bestTimeMs, hardMode, setHardMode, questMastered } = useSharedHud(onExerciseComplete);
  const setCameraStatus = useSortWordsStore((s) => s.setCameraStatus);
  const swipeDebug = useSortWordsStore((s) => s.swipeDebug);

  useEffect(() => {
    setCameraStatus(hand.status);
  }, [hand.status, setCameraStatus]);

  return (
    <>
      <div className="absolute inset-0">
        <ZhelayakScene hand={hand.status === 'tracking' || hand.status === 'no-hand' ? hand : null} />
      </div>
      <ZhelayakHUD
        activeSet={ex.activeSet}
        score={ex.score}
        streak={ex.streak}
        timeLeftMs={ex.timeLeftMs}
        timeLimitMs={timeLimitMs}
        answered={ex.correctCount + ex.wrongCount}
        total={ex.totalWords}
        masteredCount={questMastered}
        totalSets={1}
        cameraStatus={hand.status}
        cameraError={hand.error}
        controlMode={controlMode}
        onControlMode={setControlMode}
        onToggleCamera={() => setCameraEnabled((v) => !v)}
        onNextSet={ex.nextSet}
        onRestart={ex.restart}
        showCamera
        result={ex.roundState === 'finished' ? ex.lastResult : null}
        bestTimeMs={bestTimeMs}
        hardMode={hardMode}
        onHardMode={setHardMode}
        swipeDebug={process.env.NODE_ENV === 'development' ? swipeDebug : undefined}
      />
      <CameraFeedOverlay hand={hand} />
      <FeedbackBanner feedback={feedback} onClear={clearFeedback} />
    </>
  );
}

function MobileQuest({ onExerciseComplete }: Props) {
  const { ex, feedback, clearFeedback, controlMode, setControlMode, timeLimitMs, bestTimeMs, hardMode, setHardMode, questMastered } = useSharedHud(onExerciseComplete);
  return (
    <>
      <MobileZhelayak />
      <ZhelayakHUD
        activeSet={ex.activeSet}
        score={ex.score}
        streak={ex.streak}
        timeLeftMs={ex.timeLeftMs}
        timeLimitMs={timeLimitMs}
        answered={ex.correctCount + ex.wrongCount}
        total={ex.totalWords}
        masteredCount={questMastered}
        totalSets={1}
        cameraStatus="idle"
        cameraError={null}
        controlMode={controlMode}
        onControlMode={setControlMode}
        onToggleCamera={() => undefined}
        onNextSet={ex.nextSet}
        onRestart={ex.restart}
        showCamera={false}
        result={ex.roundState === 'finished' ? ex.lastResult : null}
        bestTimeMs={bestTimeMs}
        hardMode={hardMode}
        onHardMode={setHardMode}
      />
      <FeedbackBanner feedback={feedback} onClear={clearFeedback} />
    </>
  );
}

export function ZhelayakExercise({ onExerciseComplete }: Props) {
  const isMobile = useIsMobile();

  if (isMobile === null) {
    return <div className="absolute inset-0 flex items-center justify-center text-[#d8c7a1]/50 text-sm">Жүктелуде…</div>;
  }
  return isMobile ? <MobileQuest onExerciseComplete={onExerciseComplete} /> : <DesktopQuest onExerciseComplete={onExerciseComplete} />;
}
