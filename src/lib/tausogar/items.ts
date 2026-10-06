/**
 * Банк вопросов квеста «Таусоғар» — 10 сынып «Қазақ тілі».
 *
 * Два типа заданий (поле `type`):
 *  - 'choice' — сөйлемнің мақсатына қарай түрлері: хабарлы, сұраулы,
 *    лепті сөйлем (тыныс белгісі мен интонация бойынша ажыратылады);
 *  - 'match' — сопоставление: грамматикалық термин ↔ анықтамасы
 *    (сөйлем мүшелері), перетаскиванием.
 */

export type TausogarCategory = 'declarative' | 'interrogative' | 'exclamatory';

export interface TausogarChoiceQuestion {
  type: 'choice';
  text: string;
  category: TausogarCategory;
  /** Қате жауап бергенде көрсетілетін түсіндірме */
  hint: string;
}

export interface MatchPair {
  hero: string;
  ability: string;
}

export interface TausogarMatchQuestion {
  type: 'match';
  title: string;
  pairs: readonly MatchPair[];
  /** Лишние карточки способностей без пары — их никуда нельзя положить верно */
  distractors?: readonly string[];
}

export type TausogarQuestion = TausogarChoiceQuestion | TausogarMatchQuestion;

const CHOICE_QUESTIONS: readonly TausogarChoiceQuestion[] = [
  // Хабарлы сөйлем — жай хабар береді, соңында нүкте тұрады
  { type: 'choice', text: 'Таусоғар тасты бір соққымен жарады.', category: 'declarative', hint: 'Сөйлем жай хабар беріп тұр, соңында нүкте бар — хабарлы сөйлем.' },
  { type: 'choice', text: 'Ол серіктеріне жол ашады.', category: 'declarative', hint: 'Хабарлы сөйлем: ой тыныш хабар түрінде, нүктемен аяқталады.' },
  { type: 'choice', text: 'Таудың жынысы оның қолынан қирайды.', category: 'declarative', hint: 'Сөйлем баяндау түрінде, сұрақ та, леп те жоқ — хабарлы сөйлем.' },
  { type: 'choice', text: 'Ер-Төстік оның күшіне сенеді.', category: 'declarative', hint: 'Жай хабар, нүктемен аяқталған — хабарлы сөйлем.' },
  { type: 'choice', text: 'Таусоғар қоршауды бұзып өтеді.', category: 'declarative', hint: 'Хабарлы сөйлем: оқиғаны жай түрде баяндайды.' },

  // Сұраулы сөйлем — сұрақ қояды, соңында «?» тұрады
  { type: 'choice', text: 'Таусоғар тасты қалай жарады?', category: 'interrogative', hint: '«Қалай?» сұрау есімдігі мен сұрақ белгісі бар — сұраулы сөйлем.' },
  { type: 'choice', text: 'Ол қай жерден жол ашпақ?', category: 'interrogative', hint: '«Қай?» сұрау есімдігі, соңында «?» — сұраулы сөйлем.' },
  { type: 'choice', text: 'Неге Таусоғар тоқтамай алға басады?', category: 'interrogative', hint: '«Неге?» сұрау үстеуі, сұрақ белгісімен аяқталады — сұраулы сөйлем.' },
  { type: 'choice', text: 'Батыр қанша қоршауды бұзды?', category: 'interrogative', hint: '«Қанша?» сұрау есімдігі бар — сұраулы сөйлем.' },
  { type: 'choice', text: 'Таусоғар серіктерін құтқара ала ма?', category: 'interrogative', hint: '«-ма» сұраулық шылауы мен «?» белгісі — сұраулы сөйлем.' },

  // Лепті сөйлем — күшті сезімді білдіреді, соңында «!» тұрады
  { type: 'choice', text: 'Таусоғардың күші нендей ғажап!', category: 'exclamatory', hint: 'Таңданыс сезімі және леп белгісі бар — лепті сөйлем.' },
  { type: 'choice', text: 'Тас бір сәтте быт-шыт болды!', category: 'exclamatory', hint: 'Күшті эмоциямен айтылып, «!» белгісімен аяқталған — лепті сөйлем.' },
  { type: 'choice', text: 'Міне, нағыз батыр осындай болады!', category: 'exclamatory', hint: '«Міне» одағайы мен леп белгісі — лепті сөйлем.' },
  { type: 'choice', text: 'Қандай мықты соққы еді!', category: 'exclamatory', hint: '«Қандай» одағай мәнінде қолданылып, таңданысты білдіреді — лепті сөйлем.' },
  { type: 'choice', text: 'Жол ашылды, алға!', category: 'exclamatory', hint: 'Леп белгісімен аяқталған, үндеу мәнді сөйлем — лепті сөйлем.' },
];

const MATCH_QUESTIONS: readonly TausogarMatchQuestion[] = [
  {
    type: 'match',
    title: 'Терминді анықтамасымен сәйкестендір',
    pairs: [
      { hero: 'Бастауыш', ability: 'Сөйлемде іс-қимылдың иесін білдіретін мүше' },
      { hero: 'Баяндауыш', ability: 'Сөйлемдегі негізгі іс-қимылды білдіретін мүше' },
      { hero: 'Анықтауыш', ability: 'Затты сипаттап, сынын білдіретін мүше' },
      { hero: 'Толықтауыш', ability: 'Іс-қимылдың объектісін білдіретін мүше' },
    ],
    distractors: ['Сөйлемнің соңына қойылатын тыныс белгісі'],
  },
];

export const TAUSOGAR_QUESTIONS: readonly TausogarQuestion[] = [...CHOICE_QUESTIONS, ...MATCH_QUESTIONS];

export function shuffleItems<T>(items: readonly T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
