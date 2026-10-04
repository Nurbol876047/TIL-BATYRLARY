'use client';

import { motion } from 'framer-motion';

/** Силуэт кумгана — одна и та же форма для всех трёх кувшинов-ответов */
const JUG_PATH =
  'M30,8 C30,3 40,0 50,0 C60,0 70,3 70,8 L70,22 C85,30 92,46 92,66 C92,100 74,128 50,128 C26,128 8,100 8,66 C8,46 15,30 30,22 Z';
const VIEW_H = 130;
const WATER_BOTTOM = 128;

export type JugVisualState = 'idle' | 'hover' | 'correct' | 'wrong' | 'dimmed';

interface Props {
  /** 0..1 — насколько полон кувшин */
  level: number;
  state: JugVisualState;
  clipId: string;
}

/**
 * Кувшин с водой вместо плоской кнопки. Уровень воды поднимается, когда
 * рука наводится на ответ, и до краёв заполняется/выплёскивается при
 * правильном выборе — или мутнеет и опустошается при неверном.
 */
export function WaterJug({ level, state, clipId }: Props) {
  const fillHeight = Math.max(0, Math.min(1, level)) * WATER_BOTTOM;
  const fillY = WATER_BOTTOM - fillHeight;
  const isWrong = state === 'wrong';

  return (
    <svg viewBox={`0 0 100 ${VIEW_H}`} className={`w-32 h-40 md:w-44 md:h-56 transition-[filter,opacity] duration-300 ${state === 'dimmed' ? 'opacity-40 grayscale' : ''}`}>
      <defs>
        <clipPath id={clipId}>
          <path d={JUG_PATH} />
        </clipPath>
        <linearGradient id={`${clipId}-water`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={isWrong ? '#c2645f' : '#5fd2da'} />
          <stop offset="100%" stopColor={isWrong ? '#6b2b28' : '#166872'} />
        </linearGradient>
        <linearGradient id={`${clipId}-clay`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f2e9d8" />
          <stop offset="100%" stopColor="#d8c6a1" />
        </linearGradient>
      </defs>

      {/* тело кувшина */}
      <path d={JUG_PATH} fill={`url(#${clipId}-clay)`} stroke="#b9a37a" strokeWidth={1.5} />

      {/* вода, обрезанная по форме кувшина */}
      <g clipPath={`url(#${clipId})`}>
        <motion.rect
          x={-5}
          width={110}
          fill={`url(#${clipId}-water)`}
          initial={false}
          animate={{ y: fillY, height: fillHeight + 12 }}
          transition={{ type: 'spring', stiffness: 110, damping: isWrong ? 16 : 20 }}
        />
        {/* блик на поверхности воды */}
        <motion.rect x={-5} width={110} height={3} fill="#eafcff" opacity={0.55} initial={false} animate={{ y: fillY }} transition={{ type: 'spring', stiffness: 110, damping: 20 }} />
      </g>

      {/* горлышко */}
      <path d="M30,8 C30,3 40,0 50,0 C60,0 70,3 70,8 L70,15 L30,15 Z" fill="#cbb892" stroke="#b9a37a" strokeWidth={1} />
      {/* орнамент-волна на плечике, как на чапане Қолтаусара */}
      <path d="M12,42 C30,32 70,32 88,42" fill="none" stroke={isWrong ? '#e2545c' : '#3fb6c2'} strokeWidth={2.5} strokeLinecap="round" opacity={state === 'dimmed' ? 0.25 : 0.75} />
    </svg>
  );
}
