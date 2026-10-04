'use client';

import { useEffect, useRef } from 'react';
import { useKoltausarStore } from '@/store/koltausarStore';
import type { HandFrame, HandTracking } from '@/hooks/hand/useMediaPipeHands';

export const KOLTAUSAR_OPTION_ATTR = 'data-koltausar-option';

/**
 * Указка-рука для квиза: никакой 3D-сцены и перетаскивания — курсор
 * (кончик указательного пальца, уже сглажен в useMediaPipeHands) двигается
 * по экрану как мышь, а щипок над кнопкой ответа сразу жмёт её — как
 * обычный клик, только рукой.
 */
export function useKoltausarHandController(hand: Pick<HandTracking, 'subscribe'> | null): void {
  const wasPinching = useRef(false);

  useEffect(() => {
    if (!hand) return;
    const onFrame = (frame: HandFrame | null) => {
      const st = useKoltausarStore.getState();
      if (!frame) {
        wasPinching.current = false;
        if (st.cursor.visible) st.setCursor({ visible: false, pinching: false });
        st.setHoverOption(null);
        return;
      }
      const tip = frame.landmarks[8];
      const px = (1 - tip.x) * window.innerWidth;
      const py = tip.y * window.innerHeight;
      st.setCursor({ x: px / window.innerWidth, y: py / window.innerHeight, visible: true, pinching: frame.isPinching });

      const el = document.elementFromPoint(px, py);
      const optionEl = el?.closest(`[${KOLTAUSAR_OPTION_ATTR}]`) as HTMLElement | null;
      const hoverIndex = optionEl ? Number(optionEl.getAttribute(KOLTAUSAR_OPTION_ATTR)) : null;
      st.setHoverOption(hoverIndex);

      if (frame.isPinching && !wasPinching.current && hoverIndex !== null) {
        st.answer(hoverIndex);
      }
      wasPinching.current = frame.isPinching;
    };
    return hand.subscribe(onFrame);
  }, [hand]);
}
