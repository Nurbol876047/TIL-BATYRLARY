'use client';

import { motion } from 'framer-motion';

export type GateVisualState = 'idle' | 'hover' | 'correct' | 'wrong' | 'dimmed';

interface Props {
  /** 0..1 — насколько широко раскрываются врата */
  level: number;
  state: GateVisualState;
}

/** Зигзаг-трещина посередине горы и две половины силуэта по бокам от неё */
const CRACK = 'M60,10 L54,40 L62,66 L50,96 L60,130';
const LEFT_D = 'M60,10 L54,40 L62,66 L50,96 L60,130 L8,130 L14,95 L24,60 L36,30 Z';
const RIGHT_D = 'M60,10 L54,40 L62,66 L50,96 L60,130 L112,130 L106,95 L96,60 L84,30 Z';

/**
 * Кнопка-ответ квиза «Таусоғар» — каменные врата горы, раскалывающиеся
 * надвое вместо кувшина, колец или гранёного осколка. Половины расходятся
 * в стороны, пока рука наводится, и распахиваются светом при правильном
 * ответе — или захлопываются с трещиной-разрядом при неверном.
 */
export function MountainGate({ level, state }: Props) {
  const isWrong = state === 'wrong';
  const isCorrect = state === 'correct';
  const color = isWrong ? '#e2545c' : '#8fd9ff';
  const dimmed = state === 'dimmed';
  const spread = level * 18;
  const glowOpacity = 0.08 + level * 0.7;

  return (
    <div className={`relative w-32 h-36 md:w-44 md:h-52 transition-opacity duration-300 ${dimmed ? 'opacity-30 grayscale' : ''}`}>
      <svg viewBox="0 0 120 140" className="w-full h-full overflow-visible">
        <defs>
          <radialGradient id="gate-glow" cx="50%" cy="55%" r="55%">
            <stop offset="0%" stopColor={color} stopOpacity={0.95} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </radialGradient>
          <linearGradient id="gate-rock-l" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8a8071" />
            <stop offset="100%" stopColor="#4a4238" />
          </linearGradient>
          <linearGradient id="gate-rock-r" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#8a8071" />
            <stop offset="100%" stopColor="#4a4238" />
          </linearGradient>
        </defs>

        {/* свет, пробивающийся из-за открывающихся врат */}
        <motion.ellipse cx={60} cy={78} rx={38} ry={50} fill="url(#gate-glow)" initial={false} animate={{ opacity: glowOpacity, scale: isCorrect ? 1.15 : 1 }} transition={{ type: 'spring', stiffness: 120, damping: 18 }} style={{ transformOrigin: '60px 78px' }} />

        <motion.g
          initial={false}
          animate={isWrong ? { x: [0, -4, 3, -2, 0] } : { x: -spread }}
          transition={isWrong ? { duration: 0.4, ease: 'easeInOut' } : { type: 'spring', stiffness: 170, damping: 15 }}
        >
          <path d={LEFT_D} fill="url(#gate-rock-l)" stroke="#241c14" strokeWidth={2.5} strokeLinejoin="round" />
          <path d={CRACK} fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" opacity={0.25 + level * 0.65} />
        </motion.g>
        <motion.g
          initial={false}
          animate={isWrong ? { x: [0, 4, -3, 2, 0] } : { x: spread }}
          transition={isWrong ? { duration: 0.4, ease: 'easeInOut' } : { type: 'spring', stiffness: 170, damping: 15 }}
        >
          <path d={RIGHT_D} fill="url(#gate-rock-r)" stroke="#241c14" strokeWidth={2.5} strokeLinejoin="round" />
          <path d={CRACK} fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" opacity={0.25 + level * 0.65} />
        </motion.g>
      </svg>

      {(state === 'hover' || isCorrect) && (
        <>
          <span className="absolute w-1.5 h-1.5 rounded-full bg-sky-200/80 animate-[float-up_1.1s_ease-in_infinite]" style={{ left: '46%', bottom: '30%' }} />
          <span className="absolute w-1 h-1 rounded-full bg-sky-100/70 animate-[float-up_1.4s_ease-in_infinite_0.3s]" style={{ left: '54%', bottom: '34%' }} />
        </>
      )}
    </div>
  );
}
