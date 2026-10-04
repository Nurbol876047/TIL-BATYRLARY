'use client';

import { AnimatePresence, motion, type PanInfo } from 'framer-motion';
import { useSortWordsStore } from '@/store/sortWordsStore';
import { ZHELAYAK_THEME } from './theme';

/**
 * 2D-режим для мобильных: тот же drag/tap, что в Sort the Words, но в
 * одежде квеста «Желаяқ» — свиток-стрела в центре, три идола-кнопки снизу.
 */
export function MobileZhelayak() {
  const word = useSortWordsStore((s) => s.currentWord);
  const baskets = useSortWordsStore((s) => s.baskets);
  const sortWord = useSortWordsStore((s) => s.sortWord);
  const onArrive = useSortWordsStore((s) => s.onArrive);
  const onFlightEnd = useSortWordsStore((s) => s.onFlightEnd);

  const canAct = word?.state === 'waiting';

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (!canAct) return;
    const { x, y } = info.offset;
    if (y < -80 && Math.abs(x) < 120) sortWord(1);
    else if (x < -80) sortWord(0);
    else if (x > 80) sortWord(2);
  };

  const target = word?.state === 'flying' && word.targetBasket !== null ? word.targetBasket : null;
  const flyX = target === null ? 0 : (target - 1) * 130;

  return (
    <div className="absolute inset-0 flex flex-col justify-end items-center gap-10 px-4 pb-40">
      <div className="h-32 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {word && (
            <motion.div
              key={word.id}
              drag={canAct}
              dragSnapToOrigin
              onDragEnd={onDragEnd}
              onAnimationComplete={() => {
                if (word.state === 'incoming') onArrive();
                if (word.state === 'flying') onFlightEnd();
              }}
              initial={{ opacity: 0, scale: 0.5, y: -60 }}
              animate={
                word.state === 'flying'
                  ? { opacity: 0, scale: 0.4, x: flyX, y: 200, transition: { duration: 0.45 } }
                  : word.state === 'rejected'
                    ? { opacity: 1, scale: 1, x: [0, -10, 10, -8, 8, 0], y: 0, transition: { duration: 0.45 } }
                    : { opacity: 1, scale: 1, x: 0, y: 0, transition: { duration: 0.35 } }
              }
              exit={{ opacity: 0 }}
              className={`relative px-6 py-4 border text-lg font-semibold select-none touch-none bg-gradient-to-b from-[#2a1d10]/95 to-[#180f07]/95 ${
                word.state === 'rejected' ? 'border-red-400/70 text-red-100' : 'border-[#caa355]/45 text-[#f1e7d6]'
              }`}
              style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
            >
              {word.text}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-3 gap-2 w-full max-w-md">
        {baskets.map((b) => {
          const theme = ZHELAYAK_THEME[b.index % ZHELAYAK_THEME.length];
          return (
            <button
              key={b.index}
              onClick={() => canAct && sortWord(b.index)}
              className="h-16 border text-sm font-semibold transition-transform active:scale-95 bg-black/30"
              style={{ borderColor: `${theme.accent}80`, color: theme.accent, clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
            >
              {b.label}
              <span className="block text-xs opacity-60 font-normal">{b.count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
