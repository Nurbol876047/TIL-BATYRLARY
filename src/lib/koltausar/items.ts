/**
 * Банк вопросов квеста «Қолтаусар» (сказка «Ер-Төстік»). Формат тот же,
 * что доказал себя в квесте Желаяка: утверждение + куда оно относится —
 * к самому батыру, к другому батыру той же сказки (похоже, но не он) или
 * выдумка. Три варианта ответа всегда одни и те же — игрок нажимает
 * рукой (щипок над кнопкой) или мышью/тачем на правильный.
 */

export type KoltausarCategory = 'koltausar' | 'other-hero' | 'fiction';

export interface KoltausarItem {
  text: string;
  category: KoltausarCategory;
  /** Перевод на английский — подсказка при ошибке */
  hint: string;
}

export const KOLTAUSAR_ITEMS: readonly KoltausarItem[] = [
  // Про самого Қолтаусара — без прямого повтора «су/көл» в каждой фразе,
  // через образ и сюжетную роль, а не в лоб
  { text: 'Ол бір тыныста тұтас көлді құрғатып тастайды.', category: 'koltausar', hint: 'He drains a whole lake in one breath.' },
  { text: 'Хан қойған сайыста ол қарсыласын судың бәрін ішіп жеңеді.', category: 'koltausar', hint: 'In the khan\'s contest, he beats his rival by drinking up all the water.' },
  { text: 'Оның шөлі қанша ішсе де басылмайды.', category: 'koltausar', hint: 'No matter how much he drinks, his thirst never ends.' },
  { text: 'Ол сапарда Ер-Төстіктің серігі болады.', category: 'koltausar', hint: 'He becomes Er-Tostik\'s companion on the journey.' },
  { text: 'Ол судың сарқырамасындай ағызып жұтады.', category: 'koltausar', hint: 'He gulps it down like a rushing waterfall.' },

  // Про других героев той же сказки/эпоса — тот же мотив («поглощает
  // немыслимое количество»), но имя не называется нигде
  { text: 'Ол бір отырғанда үйілген тасты түгел жеп қояды.', category: 'other-hero', hint: 'In one sitting, he eats up a whole heap of stones — a different companion.' },
  { text: 'Ол аттың ізінен қалмай, желдей жүгіреді.', category: 'other-hero', hint: 'He runs like the wind, never falling behind a horse — a different companion.' },
  { text: 'Ол жалғыз өзі айдаһарды жеңеді.', category: 'other-hero', hint: 'He alone defeats the dragon — that is Er-Tostik himself, not Koltausar.' },
  { text: 'Ол жеті жыл қатарынан ұйықтап, ешкім оны оята алмайды.', category: 'other-hero', hint: 'He sleeps seven years straight and no one can wake him — a different hero.' },
  { text: 'Ол жауынгердің семсерін бір қолымен майыстырып сындырады.', category: 'other-hero', hint: 'He bends and snaps a warrior\'s sword with one hand — a different hero\'s strength.' },

  // Выдумки — правдоподобные на первый взгляд, но не из сказки
  { text: 'Ол судың орнына отты ішіп, жалынды сөндіреді.', category: 'fiction', hint: 'He drinks fire instead of water to put out flames — not true, his gift is water.' },
  { text: 'Әр жұтқан сайын ол тау құмын бойына сіңіріп алады.', category: 'fiction', hint: 'With every gulp he absorbs a mountain of sand — invented, not in the tale.' },
  { text: 'Ол құрғақшылық кезінде аспаннан жаңбыр шақырады.', category: 'fiction', hint: 'He summons rain from the sky during drought — not his trait, that is weather magic.' },
  { text: 'Ол судан шыққан сайын алып батырға айналады.', category: 'fiction', hint: 'Each time he steps out of the water he turns into a giant warrior — invented.' },
  { text: 'Ол ішкен суын қайта мұзға айналдырып шығарады.', category: 'fiction', hint: 'He turns the water he drinks back into ice — not part of the tale.' },
];

export function shuffleItems<T>(items: readonly T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
