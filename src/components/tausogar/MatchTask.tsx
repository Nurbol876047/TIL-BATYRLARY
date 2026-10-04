'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { playChime, playError, playSuccess } from '@/lib/hand/audio';
import { shuffleItems, type TausogarMatchQuestion } from '@/lib/tausogar/items';
import { useTausogarStore } from '@/store/tausogarStore';
import { usePinchDrag, type UsePinchDragApi } from '@/hooks/tausogar/usePinchDrag';
import type { HandTracking } from '@/hooks/hand/useMediaPipeHands';

/** Debug-режим: показывает норму щипка и состояние pinch поверх экрана */
const DEBUG = false;

interface Props {
  question: TausogarMatchQuestion;
  hand: Pick<HandTracking, 'subscribe'> | null;
}

interface CardData {
  id: string;
  ability: string;
  isDistractor: boolean;
}

interface MatchLine {
  cardId: string;
  heroId: string;
  point: { x: number; y: number };
  zoneCenter: { x: number; y: number };
  revealed?: boolean;
}

const panel = 'bg-[#0d1620]/78 backdrop-blur-md rounded-2xl border border-[#8fd9ff]/25 shadow-xl';

/**
 * Задание «Батыр — қасиеті»: героев слева, перемешанные карточки их
 * качеств справа, перетаскивание — щипком руки (usePinchDrag) или
 * мышью/тачем. Вся игровая логика (проверка пары, очки, завершение)
 * живёт здесь; хук — только геометрия жеста.
 */
export function MatchTask({ question, hand }: Props) {
  const matchCorrectPair = useTausogarStore((s) => s.matchCorrectPair);
  const matchWrongAttempt = useTausogarStore((s) => s.matchWrongAttempt);
  const completeMatch = useTausogarStore((s) => s.completeMatch);
  const revealTimeoutThenFinish = useTausogarStore((s) => s.revealTimeoutThenFinish);
  const timeLeftMs = useTausogarStore((s) => s.timeLeftMs);
  const roundState = useTausogarStore((s) => s.roundState);

  const cards = useMemo<CardData[]>(() => {
    const pool = [
      ...question.pairs.map((p) => ({ ability: p.ability, isDistractor: false })),
      ...(question.distractors ?? []).map((a) => ({ ability: a, isDistractor: true })),
    ];
    return shuffleItems(pool).map((c) => ({ id: c.ability, ability: c.ability, isDistractor: c.isDistractor }));
  }, [question]);

  const pairsByHero = useMemo(() => new Map(question.pairs.map((p) => [p.hero, p])), [question]);

  const [matches, setMatches] = useState<MatchLine[]>([]);
  const [shakeId, setShakeId] = useState<string | null>(null);
  const completedRef = useRef(false);
  const revealTriggeredRef = useRef(false);
  const dragApiRef = useRef<UsePinchDragApi | null>(null);

  const lockedCardIds = useMemo(() => new Set(matches.map((m) => m.cardId)), [matches]);
  const lockedHeroIds = useMemo(() => new Set(matches.map((m) => m.heroId)), [matches]);

  const handleDrop = (cardId: string, zoneId: string | null) => {
    const api = dragApiRef.current;
    if (!api) return;
    if (!zoneId) {
      api.returnCard(cardId);
      return;
    }
    const card = cards.find((c) => c.id === cardId);
    const pair = pairsByHero.get(zoneId);
    const correct = !!card && !card.isDistractor && pair?.ability === card.ability;

    if (correct) {
      const point = api.lockCardAtZone(cardId, zoneId);
      if (point) {
        const zoneRect = api.getZoneRect(zoneId);
        const zoneCenter = zoneRect ? { x: zoneRect.left + zoneRect.width / 2, y: zoneRect.top + zoneRect.height / 2 } : point;
        setMatches((prev) => [...prev, { cardId, heroId: zoneId, point, zoneCenter }]);
      }
      playChime();
      matchCorrectPair();
    } else {
      api.returnCard(cardId);
      setShakeId(cardId);
      setTimeout(() => setShakeId((id) => (id === cardId ? null : id)), 420);
      playError();
      matchWrongAttempt();
    }
  };

  const drag = usePinchDrag({
    hand,
    isCardLocked: (id) => lockedCardIds.has(id),
    onDrop: handleDrop,
  });
  useEffect(() => {
    dragApiRef.current = drag;
  });

  // Все настоящие пары собраны — обычное завершение
  useEffect(() => {
    if (completedRef.current || revealTriggeredRef.current) return;
    if (lockedHeroIds.size === question.pairs.length) {
      completedRef.current = true;
      playSuccess();
      completeMatch();
    }
  }, [lockedHeroIds, question, completeMatch]);

  // Время вышло посреди задания — раскрыть оставшиеся пары и завершить раунд.
  // setMatches откладываем в callback (а не зовём прямо в теле эффекта), чтобы
  // не плодить каскадные ре-рендеры синхронно внутри эффекта.
  useEffect(() => {
    if (completedRef.current || revealTriggeredRef.current) return;
    if (roundState !== 'playing' || timeLeftMs > 0) return;
    revealTriggeredRef.current = true;
    const api = dragApiRef.current;
    const reveals: MatchLine[] = [];
    if (api) {
      for (const pair of question.pairs) {
        if (lockedHeroIds.has(pair.hero)) continue;
        const point = api.lockCardAtZone(pair.ability, pair.hero);
        if (!point) continue;
        const zoneRect = api.getZoneRect(pair.hero);
        const zoneCenter = zoneRect ? { x: zoneRect.left + zoneRect.width / 2, y: zoneRect.top + zoneRect.height / 2 } : point;
        reveals.push({ cardId: pair.ability, heroId: pair.hero, point, zoneCenter, revealed: true });
      }
    }
    const timer = setTimeout(() => {
      if (reveals.length) setMatches((prev) => [...prev, ...reveals]);
      revealTimeoutThenFinish();
    }, 0);
    return () => clearTimeout(timer);
  }, [timeLeftMs, roundState, lockedHeroIds, question, revealTimeoutThenFinish]);

  return (
    <div className="w-full flex flex-col items-center gap-6">
      <div className={`${panel} px-8 py-5 text-center`}>
        <p className="text-[#8fd9ff]/60 text-xs uppercase tracking-widest mb-1">Сәйкестендіру · {lockedHeroIds.size} / {question.pairs.length}</p>
        <p className="text-[#eef6fb] text-xl md:text-2xl font-semibold">{question.title}</p>
      </div>

      <div className="w-full grid grid-cols-2 gap-6 md:gap-12">
        {/* батырлар — зоны сброса */}
        <div className="flex flex-col gap-3">
          {question.pairs.map((pair) => {
            const locked = lockedHeroIds.has(pair.hero);
            return (
              <div
                key={pair.hero}
                ref={drag.registerZone(pair.hero)}
                className={`relative rounded-2xl border-2 px-5 py-4 text-center transition-colors duration-200 ${
                  locked ? 'border-emerald-400/70 bg-emerald-500/10 text-emerald-100' : 'border-[#8fd9ff]/25 bg-white/[0.03] text-[#eef6fb]'
                }`}
              >
                <span className="font-semibold text-base md:text-lg">{pair.hero}</span>
                {locked && (
                  <span className="absolute -top-2 -right-2 bg-[#0d1620] rounded-full">
                    <CheckCircle2 size={18} className="text-emerald-300" />
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* способности — перетаскиваемые карточки */}
        <div className="flex flex-col gap-3">
          {cards.map((card) => {
            const locked = lockedCardIds.has(card.id);
            return (
              <div
                key={card.id}
                ref={drag.registerCard(card.id)}
                onPointerDown={locked ? undefined : drag.bindCardPointerDown(card.id)}
                className={`rounded-2xl border-2 px-5 py-4 text-center text-sm md:text-base select-none touch-none will-change-transform ${
                  locked
                    ? 'pointer-events-none border-emerald-400/70 bg-emerald-500/10 text-emerald-100'
                    : 'cursor-grab active:cursor-grabbing border-[#8fd9ff]/25 bg-white/[0.05] text-[#eef6fb] hover:border-[#8fd9ff]/50'
                } ${shakeId === card.id ? 'tausogar-card-shake' : ''}`}
              >
                {card.ability}
              </div>
            );
          })}
        </div>
      </div>

      {/* линии между совпавшими парами */}
      <svg className="fixed inset-0 w-screen h-screen pointer-events-none z-[5]">
        {matches.map((m) => (
          <motion.line
            key={m.cardId}
            x1={m.zoneCenter.x}
            y1={m.zoneCenter.y}
            x2={m.point.x}
            y2={m.point.y}
            stroke={m.revealed ? '#d9a441' : '#34d399'}
            strokeWidth={3}
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.85 }}
            transition={{ duration: 0.4 }}
          />
        ))}
      </svg>

      <div ref={drag.cursorRef} className="tausogar-cursor fixed top-0 left-0 z-50 pointer-events-none w-10 h-10 rounded-full border-2 border-[#8fd9ff]/70 bg-[#8fd9ff]/10 opacity-0" />

      {DEBUG && (
        // eslint-disable-next-line react-hooks/refs -- debug-only: hook forwards a ref object to attach, not reading it during render
        <div ref={drag.debugRef} className="fixed bottom-3 left-3 z-50 px-3 py-1.5 rounded-lg bg-black/70 text-[11px] font-mono text-emerald-300" />
      )}
    </div>
  );
}
