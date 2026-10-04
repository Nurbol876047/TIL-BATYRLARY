/**
 * Банк вопросов квеста «Толағай» (сказка «Ер-Төстік») — батыр невероятной
 * силы, который поднимает целые горы. Формат тот же, что в остальных
 * квестах: утверждение + куда оно относится — к самому батыру, к другому
 * батыру той же сказки (тот же мотив «невероятная способность», но не он)
 * или выдумка.
 */

export type TolagaiCategory = 'tolagai' | 'other-hero' | 'fiction';

export interface TolagaiItem {
  text: string;
  category: TolagaiCategory;
  /** Перевод на английский — подсказка при ошибке */
  hint: string;
}

export const TOLAGAI_ITEMS: readonly TolagaiItem[] = [
  // Про самого Толағая
  { text: 'Ол бір құшағына тұтас тауды көтереді.', category: 'tolagai', hint: 'He lifts an entire mountain in his arms.' },
  { text: 'Ол аңғарды бір соққымен ашады.', category: 'tolagai', hint: 'He opens a canyon with a single blow.' },
  { text: 'Оның күші жүз адамдыкінен асып түседі.', category: 'tolagai', hint: 'His strength surpasses that of a hundred men.' },
  { text: 'Ол жолды бөгеген жартасты теуіп жібереді.', category: 'tolagai', hint: 'He kicks aside the boulder blocking the path.' },
  { text: 'Ол сапарда ауыр жүкті жалғыз өзі арқалайды.', category: 'tolagai', hint: 'On the journey, he alone carries the heaviest load.' },

  // Про других героев той же сказки — тот же мотив «невероятная способность», без имён
  { text: 'Ол бір отырғанда үйілген тасты түгел жеп қояды.', category: 'other-hero', hint: 'In one sitting he eats a whole heap of stones — a different companion.' },
  { text: 'Ол аттың ізінен қалмай, желдей жүгіреді.', category: 'other-hero', hint: 'He runs like the wind, never falling behind a horse — a different companion.' },
  { text: 'Ол бір тыныста тұтас көлді құрғатып тастайды.', category: 'other-hero', hint: 'He drains a whole lake in one breath — a different companion.' },
  { text: 'Ол жер астындағы дыбысты да естіп қояды.', category: 'other-hero', hint: 'He can even hear sounds from underground — a different companion.' },
  { text: 'Ол жеті жыл қатарынан ұйықтап, ешкім оны оята алмайды.', category: 'other-hero', hint: 'He sleeps seven years straight and no one can wake him — a different hero.' },

  // Выдумки — правдоподобные на первый взгляд, но не из сказки
  { text: 'Ол тасты қолына алмай-ақ, көзімен еріте алады.', category: 'fiction', hint: 'He can melt stone with his gaze alone — invented, that is a different power.' },
  { text: 'Ол неғұрлым шаршаса, соғұрлым күшейе береді.', category: 'fiction', hint: 'The more tired he gets, the stronger he becomes — invented.' },
  { text: 'Ол тауды емес, тұтас аспанды көтереді дейді.', category: 'fiction', hint: 'They say he lifts the whole sky, not mountains — exaggerated invention.' },
  { text: 'Оның күші тек түнде ғана жұмыс істейді.', category: 'fiction', hint: 'His strength only works at night — invented restriction.' },
  { text: 'Ол жеңілген сайын одан да ауыр тас көтереді.', category: 'fiction', hint: 'Every time he loses, he lifts an even heavier stone — invented.' },
];

export function shuffleItems<T>(items: readonly T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
