/**
 * Банк вопросов квеста «Саққұлақ» (сказка «Ер-Төстік») — батыр с невероятным
 * слухом. Формат тот же, что в квестах Желаяка и Қолтаусара: утверждение +
 * куда оно относится — к самому батыру, к другому батыру той же сказки
 * (тот же мотив «невероятная способность», но не он) или выдумка.
 */

export type SakkulakCategory = 'sakkulak' | 'other-hero' | 'fiction';

export interface SakkulakItem {
  text: string;
  category: SakkulakCategory;
  /** Перевод на английский — подсказка при ошибке */
  hint: string;
}

export const SAKKULAK_ITEMS: readonly SakkulakItem[] = [
  // Про самого Саққұлақа
  { text: 'Ол жер астындағы дыбысты да естіп қояды.', category: 'sakkulak', hint: 'He can even hear sounds coming from underground.' },
  { text: 'Ол алыстағы дұшпанның аяқ дыбысын бірден таниды.', category: 'sakkulak', hint: 'He instantly recognizes a distant enemy\'s footsteps.' },
  { text: 'Ол Ер-Төстікке қауіпті алдын ала естіртіп отырады.', category: 'sakkulak', hint: 'He warns Er-Tostik of danger by hearing it first.' },
  { text: 'Құлағын жерге төссе, арғы беттегі дыбысты да ажыратады.', category: 'sakkulak', hint: 'Pressed to the ground, his ear picks out sound from the far side of the earth.' },
  { text: 'Оның құлағы жүздеген шақырымдағы дыбысты шалады.', category: 'sakkulak', hint: 'His ears catch sound from hundreds of kilometers away.' },

  // Про других героев той же сказки — тот же мотив «невероятная способность», без имён
  { text: 'Ол бір отырғанда үйілген тасты түгел жеп қояды.', category: 'other-hero', hint: 'In one sitting he eats a whole heap of stones — a different companion.' },
  { text: 'Ол аттың ізінен қалмай, желдей жүгіреді.', category: 'other-hero', hint: 'He runs like the wind, never falling behind a horse — a different companion.' },
  { text: 'Ол бір тыныста тұтас көлді құрғатып тастайды.', category: 'other-hero', hint: 'He drains a whole lake in one breath — a different companion.' },
  { text: 'Ол жеті жыл қатарынан ұйықтап, ешкім оны оята алмайды.', category: 'other-hero', hint: 'He sleeps seven years straight and no one can wake him — a different hero.' },
  { text: 'Ол жауынгердің семсерін бір қолымен майыстырып сындырады.', category: 'other-hero', hint: 'He bends and snaps a warrior\'s sword with one hand — a different hero.' },

  // Выдумки — правдоподобные на слух, но не из сказки
  { text: 'Ол тыныштықта өз жүрегінің соғысын естімейді.', category: 'fiction', hint: 'He can\'t even hear his own heartbeat in silence — not true, that contradicts his whole gift.' },
  { text: 'Ол құлағымен көрмейтін затты да көреді.', category: 'fiction', hint: 'He can "see" invisible objects with his ears — invented, that is a different sense.' },
  { text: 'Ол дыбыс шығармай-ақ адамның ойын оқиды.', category: 'fiction', hint: 'He reads minds without any sound — invented, that is mind-reading, not hearing.' },
  { text: 'Құлағын жауып алса, бәрін бұрынғыдан да жақсы естиді.', category: 'fiction', hint: 'Covering his ears makes him hear even better — invented nonsense.' },
  { text: 'Ол тек түнде ғана естиді, күндіз мүлде естімейді.', category: 'fiction', hint: 'He can only hear at night, never during the day — invented restriction.' },
];

export function shuffleItems<T>(items: readonly T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
