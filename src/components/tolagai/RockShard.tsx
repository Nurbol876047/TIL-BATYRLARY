'use client';

import { motion } from 'framer-motion';

export type ShardVisualState = 'idle' | 'hover' | 'correct' | 'wrong' | 'dimmed';

interface Props {
  /** 0..1 — насколько сильно «тянется» сила по трещинам */
  level: number;
  state: ShardVisualState;
}

/** Силуэт гранёного осколка скалы — острые прямые грани вместо гладких кривых */
const OUTLINE = 'M60,8 L88,19 L107,48 L99,84 L71,110 L40,107 L14,77 L10,42 L34,16 Z';
const CORE = [60, 58] as const;
/** Трещины-лучи от ядра к вершинам — загораются по одной по мере роста уровня */
const CRACKS: ReadonlyArray<readonly [number, number]> = [
  [60, 8],
  [107, 48],
  [71, 110],
  [14, 77],
  [34, 16],
];
const STEP = 1 / CRACKS.length;

/**
 * Кнопка-ответ квиза «Толағай» — осколок скалы с огненными трещинами силы
 * вместо кувшина или звуковых колец. Трещины загораются по одной, пока рука
 * наводится, камень приподнимается рывком при верном ответе и обрушивается
 * при неверном.
 */
export function RockShard({ level, state }: Props) {
  const isWrong = state === 'wrong';
  const isCorrect = state === 'correct';
  const color = isWrong ? '#e2545c' : '#f2a341';
  const dimmed = state === 'dimmed';

  const lift = isCorrect ? -16 : state === 'hover' ? -7 : isWrong ? 6 : 0;
  const shadowScale = isCorrect ? 0.55 : state === 'hover' ? 0.8 : isWrong ? 1.1 : 1;

  return (
    <div className={`relative w-32 h-32 md:w-44 md:h-44 flex items-center justify-center transition-opacity duration-300 ${dimmed ? 'opacity-30 grayscale' : ''}`}>
      {/* тень на земле — съёживается, когда камень поднимается */}
      <motion.div
        className="absolute bottom-2 w-16 h-4 md:w-20 md:h-5 rounded-[50%] bg-black/50 blur-[2px]"
        initial={false}
        animate={{ scaleX: shadowScale, opacity: 0.5 * shadowScale }}
        transition={{ type: 'spring', stiffness: 140, damping: 16 }}
      />

      <motion.svg
        viewBox="0 0 120 120"
        className="relative w-full h-full"
        initial={false}
        animate={isWrong ? { y: lift, x: [0, -5, 5, -4, 4, 0] } : { y: lift, x: 0 }}
        transition={{
          y: { type: 'spring', stiffness: 160, damping: isWrong ? 12 : 14 },
          x: isWrong ? { duration: 0.4, ease: 'easeInOut' } : { type: 'spring', stiffness: 160, damping: 14 },
        }}
      >
        {/* грань скалы — чёткий прямолинейный контур */}
        <path d={OUTLINE} fill="url(#rock-fill)" stroke="#2a211a" strokeWidth={2.5} strokeLinejoin="round" />
        <defs>
          <linearGradient id="rock-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8a7a63" />
            <stop offset="100%" stopColor="#5c5244" />
          </linearGradient>
        </defs>

        {/* трещины силы — загораются по одной */}
        {CRACKS.map(([x, y], i) => {
          const active = Math.max(0, Math.min(1, (level - i * STEP) / STEP));
          return (
            <motion.line
              key={i}
              x1={CORE[0]}
              y1={CORE[1]}
              x2={x}
              y2={y}
              stroke={color}
              strokeWidth={2}
              strokeLinecap="round"
              initial={false}
              animate={{ opacity: 0.1 + active * 0.85 }}
              transition={{ type: 'spring', stiffness: 120, damping: 18 }}
            />
          );
        })}

        {/* ядро-руна в центре */}
        <motion.circle
          cx={CORE[0]}
          cy={CORE[1]}
          r={7}
          fill="none"
          stroke={color}
          strokeWidth={2.5}
          initial={false}
          animate={{ opacity: 0.25 + level * 0.65, scale: 1 + level * 0.25 }}
          transition={{ type: 'spring', stiffness: 140, damping: 16 }}
          style={{ transformOrigin: `${CORE[0]}px ${CORE[1]}px` }}
        />
      </motion.svg>

      {(state === 'hover' || isCorrect) && (
        <>
          <span className="absolute w-1.5 h-1.5 rounded-full bg-amber-300/80 animate-[float-up_1.1s_ease-in_infinite]" style={{ left: '38%', bottom: '20%' }} />
          <span className="absolute w-1 h-1 rounded-full bg-amber-200/70 animate-[float-up_1.4s_ease-in_infinite_0.3s]" style={{ left: '58%', bottom: '24%' }} />
        </>
      )}
    </div>
  );
}
