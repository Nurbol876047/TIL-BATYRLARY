'use client';

import { useCallback, useEffect, useRef } from 'react';
import { EmaSmoother3, PinchDetector, pinchRatio } from '@/lib/hand/handGeometry';
import type { HandFrame, HandTracking } from '@/hooks/hand/useMediaPipeHands';

/** Щипок считается начатым при norm < ON и отпущенным при norm > OFF (гистерезис) */
export const PINCH_ON = 0.25;
export const PINCH_OFF = 0.35;
/** Новое состояние щипка принимается, только продержавшись подряд это число кадров */
export const PINCH_DEBOUNCE_FRAMES = 3;
/** Если рука пропала из кадра дольше этого во время перетаскивания — карточка возвращается сама */
export const HAND_LOST_CANCEL_MS = 500;
/** Сглаживание курсора руки на экране (EMA) */
export const CURSOR_SMOOTHING_ALPHA = 0.4;

type DragSource = 'hand' | 'pointer';

interface UsePinchDragOptions {
  hand: Pick<HandTracking, 'subscribe'> | null;
  /** Карточка locked — больше не участвует в перетаскивании/хит-тестах */
  isCardLocked: (cardId: string) => boolean;
  onGrab?: (cardId: string) => void;
  /** Отпустили над zoneId (null — мимо) — вызывающий код решает, верно это или нет */
  onDrop: (cardId: string, zoneId: string | null) => void;
  onCancel?: (cardId: string) => void;
}

export interface UsePinchDragApi {
  /** Повесить на <div> видимого курсора — хук сам позиционирует его через rAF */
  cursorRef: React.RefObject<HTMLDivElement | null>;
  /** Повесить на <div> debug-оверлея (норма щипка, pinching) */
  debugRef: React.RefObject<HTMLDivElement | null>;
  /** ref-колбэк для карточки способности — вызывать как ref={registerCard(id)} */
  registerCard: (id: string) => (el: HTMLDivElement | null) => void;
  /** ref-колбэк для зоны-героя — вызывать как ref={registerZone(id)} */
  registerZone: (id: string) => (el: HTMLDivElement | null) => void;
  /** onPointerDown для карточки — мышь/тач фоллбэк */
  bindCardPointerDown: (id: string) => (e: React.PointerEvent) => void;
  /** Зафиксировать карточку над зоной (верная пара) — плавный snap; возвращает точку центра для линии */
  lockCardAtZone: (cardId: string, zoneId: string) => { x: number; y: number } | null;
  /** Вернуть карточку на исходное место (мимо или неверно) */
  returnCard: (cardId: string) => void;
  /** Текущий (кэшированный) прямоугольник зоны — для рисования соединительной линии */
  getZoneRect: (zoneId: string) => DOMRect | null;
  /** Текущий (кэшированный) прямоугольник карточки в её постоянном (locked) месте */
  getCardRect: (cardId: string) => DOMRect | null;
}

interface Point {
  x: number;
  y: number;
}

/**
 * Движок drag-n-drop для задания «сәйкестендіру»: щипок руки (с гистерезисом
 * и дебаунсом) или мышь/тач — два источника с общей логикой. Курсор и
 * перетаскиваемая карточка позиционируются напрямую через DOM в
 * requestAnimationFrame, без setState на каждый кадр трекинга.
 */
export function usePinchDrag({ hand, isCardLocked, onGrab, onDrop, onCancel }: UsePinchDragOptions): UsePinchDragApi {
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const debugRef = useRef<HTMLDivElement | null>(null);

  const cardEls = useRef(new Map<string, HTMLDivElement>());
  const cardRects = useRef(new Map<string, DOMRect>());
  const cardCallbacks = useRef(new Map<string, (el: HTMLDivElement | null) => void>());
  const zoneEls = useRef(new Map<string, HTMLDivElement>());
  const zoneRects = useRef(new Map<string, DOMRect>());
  const zoneCallbacks = useRef(new Map<string, (el: HTMLDivElement | null) => void>());

  const cursor = useRef<Point & { visible: boolean; source: DragSource | null }>({ x: 0, y: 0, visible: false, source: null });
  const draggedId = useRef<string | null>(null);
  const dragSource = useRef<DragSource | null>(null);
  const homeCenter = useRef<Point>({ x: 0, y: 0 });
  const hoveredZone = useRef<string | null>(null);
  const pinchingRef = useRef(false);
  const lastNorm = useRef(0);
  const handLostTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafId = useRef(0);

  const pinchDetector = useRef(new PinchDetector(PINCH_ON, PINCH_OFF));
  const debounceCandidate = useRef<{ value: boolean; count: number }>({ value: false, count: 0 });
  const smoother = useRef(new EmaSmoother3(CURSOR_SMOOTHING_ALPHA));

  // Коллбэки-пропсы меняют identity каждый рендер — а эффекты ниже
  // подписываются один раз (или на [hand]), поэтому читаем их через ref,
  // чтобы не звать «застывшую» версию с устаревшим замыканием
  const isCardLockedRef = useRef(isCardLocked);
  const onGrabRef = useRef(onGrab);
  const onDropRef = useRef(onDrop);
  const onCancelRef = useRef(onCancel);
  useEffect(() => {
    isCardLockedRef.current = isCardLocked;
    onGrabRef.current = onGrab;
    onDropRef.current = onDrop;
    onCancelRef.current = onCancel;
  });

  const hitTest = (rects: Map<string, DOMRect>, p: Point): string | null => {
    for (const [id, r] of rects) {
      if (p.x >= r.left && p.x <= r.right && p.y >= r.top && p.y <= r.bottom) return id;
    }
    return null;
  };

  const refreshRect = (id: string, els: Map<string, HTMLDivElement>, rects: Map<string, DOMRect>) => {
    const el = els.get(id);
    if (el) rects.set(id, el.getBoundingClientRect());
  };

  const registerCard = useCallback((id: string) => {
    let fn = cardCallbacks.current.get(id);
    if (!fn) {
      fn = (el) => {
        if (el) {
          cardEls.current.set(id, el);
          el.style.transform = 'translate3d(0,0,0)';
          cardRects.current.set(id, el.getBoundingClientRect());
        } else {
          cardEls.current.delete(id);
          cardRects.current.delete(id);
        }
      };
      cardCallbacks.current.set(id, fn);
    }
    return fn;
  }, []);

  const registerZone = useCallback((id: string) => {
    let fn = zoneCallbacks.current.get(id);
    if (!fn) {
      fn = (el) => {
        if (el) {
          zoneEls.current.set(id, el);
          zoneRects.current.set(id, el.getBoundingClientRect());
        } else {
          zoneEls.current.delete(id);
          zoneRects.current.delete(id);
        }
      };
      zoneCallbacks.current.set(id, fn);
    }
    return fn;
  }, []);

  // Пересчёт всех прямоугольников при изменении размеров окна
  useEffect(() => {
    const onResize = () => {
      for (const id of cardEls.current.keys()) refreshRect(id, cardEls.current, cardRects.current);
      for (const id of zoneEls.current.keys()) refreshRect(id, zoneEls.current, zoneRects.current);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const setZoneHover = (id: string | null) => {
    if (hoveredZone.current === id) return;
    const prev = hoveredZone.current ? zoneEls.current.get(hoveredZone.current) : null;
    prev?.classList.remove('tausogar-zone-hover');
    hoveredZone.current = id;
    const next = id ? zoneEls.current.get(id) : null;
    next?.classList.add('tausogar-zone-hover');
  };

  const clearHandLostTimer = () => {
    if (handLostTimer.current !== null) {
      clearTimeout(handLostTimer.current);
      handLostTimer.current = null;
    }
  };

  const startDrag = (id: string, source: DragSource) => {
    if (draggedId.current || isCardLockedRef.current(id)) return;
    const el = cardEls.current.get(id);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    homeCenter.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    draggedId.current = id;
    dragSource.current = source;
    el.style.transition = 'none';
    el.style.zIndex = '40';
    el.classList.add('tausogar-card-dragging');
    onGrabRef.current?.(id);
  };

  const endDrag = (p: Point) => {
    const id = draggedId.current;
    if (!id) return;
    const el = cardEls.current.get(id);
    const zoneId = hitTest(zoneRects.current, p);
    draggedId.current = null;
    dragSource.current = null;
    setZoneHover(null);
    el?.classList.remove('tausogar-card-dragging');
    onDropRef.current(id, zoneId);
  };

  const cancelDrag = () => {
    const id = draggedId.current;
    if (!id) return;
    const el = cardEls.current.get(id);
    draggedId.current = null;
    dragSource.current = null;
    setZoneHover(null);
    el?.classList.remove('tausogar-card-dragging');
    returnCardImpl(id);
    onCancelRef.current?.(id);
  };

  function returnCardImpl(cardId: string) {
    const el = cardEls.current.get(cardId);
    if (!el) return;
    el.style.transition = 'transform 0.35s cubic-bezier(0.34,1.4,0.64,1)';
    el.style.transform = 'translate3d(0,0,0) scale(1)';
    el.style.zIndex = '';
  }

  const returnCard = useCallback((cardId: string) => returnCardImpl(cardId), []);

  /** Плавно подводит карточку к зоне и возвращает итоговую точку её центра (для линии) */
  const lockCardAtZone = useCallback((cardId: string, zoneId: string): Point | null => {
    const el = cardEls.current.get(cardId);
    const zoneRect = zoneRects.current.get(zoneId);
    const cardRect = cardRects.current.get(cardId);
    if (!el || !zoneRect || !cardRect) return null;
    const targetCenter = { x: zoneRect.left + zoneRect.width / 2, y: zoneRect.bottom - cardRect.height / 2 - 6 };
    const homeC = { x: cardRect.left + cardRect.width / 2, y: cardRect.top + cardRect.height / 2 };
    el.style.transition = 'transform 0.3s cubic-bezier(0.34,1.4,0.64,1)';
    el.style.transform = `translate3d(${targetCenter.x - homeC.x}px, ${targetCenter.y - homeC.y}px, 0) scale(1)`;
    el.style.zIndex = '';
    return targetCenter;
  }, []);

  const bindCardPointerDown = useCallback(
    (id: string) => (e: React.PointerEvent) => {
      if (isCardLockedRef.current(id) || draggedId.current) return;
      e.preventDefault();
      e.stopPropagation();
      cursor.current = { x: e.clientX, y: e.clientY, visible: true, source: 'pointer' };
      startDrag(id, 'pointer');
    },
    [],
  );

  // ── rAF: позиционирование курсора и перетаскиваемой карточки ─────────
  useEffect(() => {
    const loop = () => {
      rafId.current = requestAnimationFrame(loop);
      const c = cursor.current;
      if (cursorRef.current) {
        cursorRef.current.style.opacity = c.visible && c.source === 'hand' ? '1' : '0';
        cursorRef.current.style.transform = `translate3d(calc(${c.x}px - 50%), calc(${c.y}px - 50%), 0)`;
        cursorRef.current.classList.toggle('tausogar-cursor-pinching', pinchingRef.current);
      }
      const id = draggedId.current;
      if (id) {
        const el = cardEls.current.get(id);
        if (el) {
          const dx = c.x - homeCenter.current.x;
          const dy = c.y - homeCenter.current.y;
          el.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(1.1)`;
        }
        setZoneHover(hitTest(zoneRects.current, c));
      }
      if (debugRef.current) {
        debugRef.current.textContent = `norm ${lastNorm.current.toFixed(2)} · pinch ${pinchingRef.current ? 'ON' : 'off'} · drag ${id ?? '—'}`;
      }
    };
    rafId.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId.current);
  }, []);

  // ── Рука ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!hand) return;
    const onFrame = (frame: HandFrame | null) => {
      if (!frame) {
        cursor.current.visible = false;
        if (draggedId.current && handLostTimer.current === null) {
          handLostTimer.current = setTimeout(() => {
            handLostTimer.current = null;
            cancelDrag();
          }, HAND_LOST_CANCEL_MS);
        }
        return;
      }
      clearHandLostTimer();

      const tip = frame.landmarks[8];
      const px = (1 - tip.x) * window.innerWidth;
      const py = tip.y * window.innerHeight;
      const smoothed = smoother.current.push({ x: px, y: py, z: 0 });
      if (dragSource.current !== 'pointer') {
        cursor.current = { x: smoothed.x, y: smoothed.y, visible: true, source: 'hand' };
      }

      const ratio = pinchRatio(frame.landmarks);
      lastNorm.current = ratio;
      const raw = pinchDetector.current.update(ratio);

      const cand = debounceCandidate.current;
      if (raw !== cand.value) {
        debounceCandidate.current = { value: raw, count: 1 };
      } else {
        cand.count++;
      }

      if (debounceCandidate.current.count >= PINCH_DEBOUNCE_FRAMES && raw !== pinchingRef.current) {
        pinchingRef.current = raw;
        if (raw) {
          const hitId = hitTest(cardRects.current, cursor.current);
          if (hitId && !isCardLockedRef.current(hitId)) startDrag(hitId, 'hand');
        } else if (draggedId.current && dragSource.current === 'hand') {
          endDrag(cursor.current);
        }
      }
    };
    return hand.subscribe(onFrame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hand]);

  // ── Мышь / тач (фоллбэк) ──────────────────────────────────────────
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (dragSource.current !== 'pointer') return;
      cursor.current = { x: e.clientX, y: e.clientY, visible: true, source: 'pointer' };
    };
    const onUp = (e: PointerEvent) => {
      if (dragSource.current !== 'pointer') return;
      endDrag({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    cursorRef,
    debugRef,
    registerCard,
    registerZone,
    bindCardPointerDown,
    lockCardAtZone,
    returnCard,
    getZoneRect: (id) => zoneRects.current.get(id) ?? null,
    getCardRect: (id) => cardRects.current.get(id) ?? null,
  };
}
