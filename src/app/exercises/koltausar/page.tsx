'use client';

import { useCallback } from 'react';
import { KoltausarExercise } from '@/components/koltausar/KoltausarExercise';
import { VideoBackdrop } from '@/components/ui/VideoBackdrop';
import type { KoltausarResult } from '@/store/koltausarStore';

// Квест про Қолтаусара (сказка «Ер-Төстік»): запускается с кнопки стихии Fire.
// Фон — тот же стандартный, что и на главном экране (не тёмный фон Sort the Words).
// Интерфейс — прямой квиз: рука наводится и щипком жмёт правильный ответ.
export default function KoltausarPage() {
  const handleComplete = useCallback((result: KoltausarResult) => {
    console.info('[koltausar] round complete', result);
  }, []);

  return (
    <main className="w-screen h-screen relative overflow-hidden bg-[#0b2a33]">
      <VideoBackdrop src="/videos/bg-main.mp4" poster="/videos/bg-main-poster.jpg" dim={0.55} />
      <KoltausarExercise onExerciseComplete={handleComplete} />
    </main>
  );
}
