'use client';

import { useCallback } from 'react';
import { TolagaiExercise } from '@/components/tolagai/TolagaiExercise';
import { VideoBackdrop } from '@/components/ui/VideoBackdrop';
import type { TolagaiResult } from '@/store/tolagaiStore';

// Квест про Толағая (сказка «Ер-Төстік»): запускается с кнопки стихии Wind.
// Фон — тот же стандартный, что и на главном экране.
export default function TolagaiPage() {
  const handleComplete = useCallback((result: TolagaiResult) => {
    console.info('[tolagai] round complete', result);
  }, []);

  return (
    <main className="w-screen h-screen relative overflow-hidden bg-[#1c140d]">
      <VideoBackdrop src="/videos/bg-main.mp4" poster="/videos/bg-main-poster.jpg" dim={0.55} />
      <TolagaiExercise onExerciseComplete={handleComplete} />
    </main>
  );
}
