'use client';

import { useCallback } from 'react';
import { ZhelayakExercise } from '@/components/zhelayak/ZhelayakExercise';
import { VideoBackdrop } from '@/components/ui/VideoBackdrop';
import type { SortRoundResult } from '@/store/sortWordsStore';

// Квест про Желаяка (сказка «Ер-Төстік»): запускается с кнопки стихии Water.
// Камера/жесты — те же, что в Sort the Words, но сцена и HUD полностью свои
// (степные идолы-балбалы и стрела-послание вместо корзин и плитки).
export default function ZhelayakPage() {
  const handleComplete = useCallback((result: SortRoundResult) => {
    console.info('[zhelayak] round complete', result);
  }, []);

  return (
    <main className="w-screen h-screen relative overflow-hidden bg-[#140d08]">
      <VideoBackdrop src="/videos/bg-main.mp4" poster="/videos/bg-main-poster.jpg" dim={0.5} />
      <ZhelayakExercise onExerciseComplete={handleComplete} />
    </main>
  );
}
