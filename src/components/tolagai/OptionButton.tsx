'use client';

import { motion } from 'framer-motion';
import { Ban, Mountain, Swords } from 'lucide-react';
import { useTolagaiStore } from '@/store/tolagaiStore';
import { TOLAGAI_OPTION_ATTR } from '@/hooks/tolagai/useTolagaiHandController';
import { TOLAGAI_OPTION_STYLE } from './theme';
import { RockShard, type ShardVisualState } from './RockShard';

const ICONS = [Mountain, Swords, Ban];
const LEVEL: Record<ShardVisualState, number> = { idle: 0.14, hover: 0.6, correct: 1, wrong: 0.05, dimmed: 0.08 };

interface Props {
  index: number;
  label: string;
  answered: boolean;
  isSelected: boolean;
  isCorrect: boolean;
  onSelect: () => void;
}

/**
 * Кнопка-ответ — гранёный осколок скалы вместо кувшина или звуковых колец.
 * Наведение рукой (щипок) или клик/тап зажигает трещины силы; правильный
 * ответ — камень рывком взмывает вверх, неверный — обрушивается и краснеет.
 */
export function OptionButton({ index, label, answered, isSelected, isCorrect, onSelect }: Props) {
  const hovered = useTolagaiStore((s) => s.hoverOption === index);
  const style = TOLAGAI_OPTION_STYLE[index];
  const Icon = ICONS[index];

  const visualState: ShardVisualState = !answered ? (hovered ? 'hover' : 'idle') : isCorrect ? 'correct' : isSelected ? 'wrong' : 'dimmed';

  const labelColor: Record<ShardVisualState, string> = {
    idle: 'text-white/80',
    hover: 'text-white',
    correct: 'text-emerald-200',
    wrong: 'text-red-200',
    dimmed: 'text-white/30',
  };

  return (
    <motion.button
      {...{ [TOLAGAI_OPTION_ATTR]: index }}
      onClick={onSelect}
      disabled={answered}
      animate={{ scale: visualState === 'hover' ? 1.06 : 1 }}
      transition={{ duration: 0.3 }}
      className="relative flex-1 min-w-[11rem] flex flex-col items-center gap-2 px-4 py-5 select-none"
      style={visualState === 'hover' ? { filter: `drop-shadow(0 0 32px ${style.glow})` } : undefined}
    >
      <span
        className="absolute top-2 right-[16%] w-8 h-8 rounded-full flex items-center justify-center border-2"
        style={{ backgroundColor: `${style.accent}26`, borderColor: `${style.accent}80` }}
      >
        <Icon size={17} style={{ color: style.accent }} />
      </span>
      <RockShard level={LEVEL[visualState]} state={visualState} />
      <span className={`text-base md:text-xl font-semibold text-center leading-tight ${labelColor[visualState]}`}>{label}</span>
    </motion.button>
  );
}
