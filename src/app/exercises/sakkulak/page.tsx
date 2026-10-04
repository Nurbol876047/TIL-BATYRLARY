'use client';

import { useCallback } from 'react';
import { SakkulakExercise } from '@/components/sakkulak/SakkulakExercise';
import { VideoBackdrop } from '@/components/ui/VideoBackdrop';
import type { SakkulakResult } from '@/store/sakkulakStore';

// Квест про Саққұлақа (сказка «Ер-Төстік»): запускается с кнопки стихии Earth.
// Фон — тот же стандартный, что и на главном экране.
export default function SakkulakPage() {
  const handleComplete = useCallback((result: SakkulakResult) => {
    console.info('[sakkulak] round complete', result);
  }, []);

  return (
    <main className="w-screen h-screen relative overflow-hidden bg-[#0b1f2e]">
      <VideoBackdrop src="/videos/bg-main.mp4" poster="/videos/bg-main-poster.jpg" dim={0.55} />
      <SakkulakExercise onExerciseComplete={handleComplete} />
    </main>
  );
}
