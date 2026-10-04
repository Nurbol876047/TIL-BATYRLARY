'use client';

import { motion } from 'framer-motion';
import { Ban, Droplet, Swords } from 'lucide-react';
import { useKoltausarStore } from '@/store/koltausarStore';
import { KOLTAUSAR_OPTION_ATTR } from '@/hooks/koltausar/useKoltausarHandController';
import { KOLTAUSAR_OPTION_STYLE } from './theme';
import { WaterJug, type JugVisualState } from './WaterJug';

const ICONS = [Droplet, Swords, Ban];
const LEVEL: Record<JugVisualState, number> = { idle: 0.16, hover: 0.55, correct: 1, wrong: 0.06, dimmed: 0.08 };

interface Props {
  index: number;
  label: string;
  answered: boolean;
  isSelected: boolean;
  isCorrect: boolean;
  onSelect: () => void;
}

/**
 * Кнопка-ответ квиза — кувшин, наполняющийся водой. Наведение рукой (щипок)
 * или клик/тап поднимает уровень; правильный ответ наполняет кувшин до
 * краёв, неверный — опустошает и мутнеет. Подсветка наведения читается
 * отдельно из стора — пересобирается только эта кнопка, а не весь экран.
 */
export function OptionButton({ index, label, answered, isSelected, isCorrect, onSelect }: Props) {
  const hovered = useKoltausarStore((s) => s.hoverOption === index);
  const style = KOLTAUSAR_OPTION_STYLE[index];
  const Icon = ICONS[index];

  const visualState: JugVisualState = !answered ? (hovered ? 'hover' : 'idle') : isCorrect ? 'correct' : isSelected ? 'wrong' : 'dimmed';

  const labelColor: Record<JugVisualState, string> = {
    idle: 'text-white/80',
    hover: 'text-white',
    correct: 'text-emerald-200',
    wrong: 'text-red-200',
    dimmed: 'text-white/30',
  };

  return (
    <motion.button
      {...{ [KOLTAUSAR_OPTION_ATTR]: index }}
      onClick={onSelect}
      disabled={answered}
      animate={
        visualState === 'wrong'
          ? { x: [0, -8, 8, -6, 6, 0] }
          : visualState === 'correct'
            ? { scale: [1, 1.1, 1] }
            : { scale: visualState === 'hover' ? 1.06 : 1, x: 0 }
      }
      transition={{ duration: visualState === 'wrong' ? 0.4 : 0.35 }}
      className="relative flex-1 min-w-[11rem] flex flex-col items-center gap-2 px-4 py-5 select-none"
      style={visualState === 'hover' ? { filter: `drop-shadow(0 0 32px ${style.glow})` } : undefined}
    >
      <span
        className="absolute top-2 right-[16%] w-8 h-8 rounded-full flex items-center justify-center border-2"
        style={{ backgroundColor: `${style.accent}26`, borderColor: `${style.accent}80` }}
      >
        <Icon size={17} style={{ color: style.accent }} />
      </span>
      <WaterJug level={LEVEL[visualState]} state={visualState} clipId={`jug-${index}`} />
      <span className={`text-base md:text-xl font-semibold text-center leading-tight ${labelColor[visualState]}`}>{label}</span>
    </motion.button>
  );
}
