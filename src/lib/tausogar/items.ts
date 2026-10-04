/**
 * Банк вопросов квеста «Таусоғар» (сказка «Ер-Төстік») — батыр, который
 * раскалывает скалу одним прикосновением.
 *
 * Два типа заданий (поле `type`):
 *  - 'choice' — утверждение + куда оно относится (как было): к самому
 *    батыру, к другому батыру той же сказки или выдумка;
 *  - 'match' — сопоставление: батыр ↔ его качество, перетаскиванием.
 */

export type TausogarCategory = 'tausogar' | 'other-hero' | 'fiction';

export interface TausogarChoiceQuestion {
  type: 'choice';
  text: string;
  category: TausogarCategory;
  /** Перевод на английский — подсказка при ошибке */
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
  // Про самого Таусоғара
  { type: 'choice', text: 'Ол жолды бөгеген тасты бір тигізуімен жарып жібереді.', category: 'tausogar', hint: 'With a single touch, he splits open the stone blocking the path.' },
  { type: 'choice', text: 'Ол тау жынысын қақ айырып, өтетін жол ашады.', category: 'tausogar', hint: 'He cleaves the mountain rock in two, opening a passage.' },
  { type: 'choice', text: 'Оның қолы тиген жер сызатталып жарылады.', category: 'tausogar', hint: 'Wherever his hand touches, the ground cracks and splits apart.' },
  { type: 'choice', text: 'Ол серіктеріне тас қамалдың артындағы жарыққа жол көрсетеді.', category: 'tausogar', hint: 'He opens the way to the light beyond the stone wall for his companions.' },
  { type: 'choice', text: 'Ол Ер-Төстіктің алдынан шыққан тас қоршауды жарып өтеді.', category: 'tausogar', hint: 'He breaks through the stone barrier blocking Er-Tostik\'s way.' },

  // Про других героев той же сказки — тот же мотив «невероятная способность», без имён
  { type: 'choice', text: 'Ол бір құшағына тұтас тауды көтереді.', category: 'other-hero', hint: 'He lifts an entire mountain in his arms — a different companion.' },
  { type: 'choice', text: 'Ол бір отырғанда үйілген тасты түгел жеп қояды.', category: 'other-hero', hint: 'In one sitting he eats a whole heap of stones — a different companion.' },
  { type: 'choice', text: 'Ол бір тыныста тұтас көлді құрғатып тастайды.', category: 'other-hero', hint: 'He drains a whole lake in one breath — a different companion.' },
  { type: 'choice', text: 'Ол жер астындағы дыбысты да естіп қояды.', category: 'other-hero', hint: 'He can even hear sounds from underground — a different companion.' },
  { type: 'choice', text: 'Ол аттың ізінен қалмай, желдей жүгіреді.', category: 'other-hero', hint: 'He runs like the wind, never falling behind a horse — a different companion.' },

  // Выдумки — правдоподобные на первый взгляд, но не из сказки
  { type: 'choice', text: 'Ол тасты жарудың орнына оны алтынға айналдырады.', category: 'fiction', hint: 'Instead of splitting stone, he turns it into gold — invented, a different power.' },
  { type: 'choice', text: 'Ол тек толған айда ғана күшін жинай алады.', category: 'fiction', hint: 'He can only gather his strength during a full moon — invented restriction.' },
  { type: 'choice', text: 'Ол жарған тастың сынықтарын жеп қояды.', category: 'fiction', hint: 'He eats the shattered stone fragments — invented, confuses him with a different hero.' },
  { type: 'choice', text: 'Ол қолын тигізбей-ақ, тек үрлеп тасты жарады.', category: 'fiction', hint: 'He splits stone just by blowing on it, without touching — invented, contradicts his touch.' },
  { type: 'choice', text: 'Оның күші жылдан-жылға азая береді.', category: 'fiction', hint: 'His strength weakens year after year — invented.' },
];

const MATCH_QUESTIONS: readonly TausogarMatchQuestion[] = [
  {
    type: 'match',
    title: 'Батырды қасиетімен сәйкестендір',
    pairs: [
      { hero: 'Таусоғар', ability: 'Тауды жұдырығымен қиратады' },
      { hero: 'Желаяқ', ability: 'Желден де жүйрік жүгіреді' },
      { hero: 'Саққұлақ', ability: 'Алыстағы дыбысты естиді' },
      { hero: 'Қолтаусар', ability: 'Көлді бір тыныста ішіп қояды' },
    ],
    distractors: ['Ұшқыр құстай ұшады'],
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
