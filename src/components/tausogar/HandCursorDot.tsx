'use client';

import { useTausogarStore } from '@/store/tausogarStore';

/** Курсор руки для квиза — обычная точка на экране, без 3D. Щипок = клик. */
export function HandCursorDot() {
  const cursor = useTausogarStore((s) => s.cursor);
  if (!cursor.visible) return null;
  return (
    <div className="fixed z-30 pointer-events-none -translate-x-1/2 -translate-y-1/2" style={{ left: `${cursor.x * 100}%`, top: `${cursor.y * 100}%` }}>
      <div
        className={`rounded-full border-2 transition-all duration-150 ${
          cursor.pinching ? 'w-7 h-7 border-[#8fd9ff] bg-[#8fd9ff]/40' : 'w-10 h-10 border-white/70 bg-white/10'
        }`}
      />
    </div>
  );
}
