'use client';

import { motion } from 'framer-motion';
import { Ear } from 'lucide-react';

export type RingVisualState = 'idle' | 'hover' | 'correct' | 'wrong' | 'dimmed';

interface Props {
  /** 0..1 — сколько звуковых колец «услышано» */
  level: number;
  state: RingVisualState;
}

const RADII = [16, 28, 40, 52];
const STEP = 1 / RADII.length;

/**
 * Кольца звука вокруг уха вместо плоской кнопки — как на видео Саққұлақа.
 * Кольца загораются по одному по мере наведения руки, все разом вспыхивают
 * при правильном ответе и гаснут/краснеют при неверном.
 */
export function SoundRings({ level, state }: Props) {
  const isWrong = state === 'wrong';
  const color = isWrong ? '#e2545c' : '#4dd8e6';
  const dimmed = state === 'dimmed';
  const pulsing = state === 'hover' || state === 'correct';

  return (
    <div className={`relative w-32 h-32 md:w-44 md:h-44 flex items-center justify-center transition-opacity duration-300 ${dimmed ? 'opacity-30 grayscale' : ''}`}>
      <svg viewBox="0 0 120 120" className="absolute inset-0 w-full h-full">
        {RADII.map((r, i) => {
          const active = Math.max(0, Math.min(1, (level - i * STEP) / STEP));
          return (
            <motion.circle
              key={r}
              cx={60}
              cy={60}
              r={r}
              fill="none"
              stroke={color}
              strokeWidth={2.5}
              initial={false}
              animate={{ opacity: 0.12 + active * 0.78 }}
              transition={{ type: 'spring', stiffness: 120, damping: 18 }}
            />
          );
        })}
      </svg>
      {pulsing && <span className="absolute inset-2 rounded-full animate-ping" style={{ boxShadow: `0 0 0 2px ${color}`, opacity: 0.3 }} />}
      <div className="relative w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center border-2" style={{ backgroundColor: `${color}22`, borderColor: `${color}99` }}>
        <Ear size={22} className="md:w-7 md:h-7" style={{ color }} />
      </div>
    </div>
  );
}
