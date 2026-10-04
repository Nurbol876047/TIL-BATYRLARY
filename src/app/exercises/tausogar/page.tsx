'use client';

import { useCallback } from 'react';
import { TausogarExercise } from '@/components/tausogar/TausogarExercise';
import { VideoBackdrop } from '@/components/ui/VideoBackdrop';
import type { TausogarResult } from '@/store/tausogarStore';

// Квест про Таусоғара (сказка «Ер-Төстік»): запускается с новой кнопки
// «Tausogar» на главном экране. Фон — тот же стандартный, что и везде.
export default function TausogarPage() {
  const handleComplete = useCallback((result: TausogarResult) => {
    console.info('[tausogar] round complete', result);
  }, []);

  return (
    <main className="w-screen h-screen relative overflow-hidden bg-[#0d1620]">
      <VideoBackdrop src="/videos/bg-main.mp4" poster="/videos/bg-main-poster.jpg" dim={0.55} />
      <TausogarExercise onExerciseComplete={handleComplete} />
    </main>
  );
}
