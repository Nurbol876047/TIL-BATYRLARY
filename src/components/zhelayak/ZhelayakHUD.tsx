'use client';

import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  Award,
  Camera,
  CameraOff,
  Compass,
  Flame,
  Hand,
  Hourglass,
  Loader2,
  MousePointer2,
  RotateCcw,
  ScrollText,
  Skull,
  Target,
  Wind,
} from 'lucide-react';
import type { HandTrackingStatus } from '@/hooks/hand/useMediaPipeHands';
import type { WordSet } from '@/lib/sort-words/wordSets';
import type { ControlMode, SortRoundResult, SwipeDebug } from '@/store/sortWordsStore';

interface Props {
  activeSet: WordSet | null;
  score: number;
  streak: number;
  timeLeftMs: number;
  timeLimitMs: number;
  answered: number;
  total: number;
  masteredCount: number;
  totalSets: number;
  cameraStatus: HandTrackingStatus;
  cameraError: string | null;
  controlMode: ControlMode;
  onControlMode: (m: ControlMode) => void;
  onToggleCamera: () => void;
  onNextSet: () => void;
  onRestart: () => void;
  showCamera: boolean;
  result: SortRoundResult | null;
  bestTimeMs: number | null;
  hardMode: boolean;
  onHardMode: (on: boolean) => void;
  swipeDebug?: SwipeDebug;
}

const CAMERA_LABEL: Record<HandTrackingStatus, { text: string; cls: string; Icon: typeof Camera }> = {
  idle: { text: 'Садақ дайын емес', cls: 'text-[#d8c7a1]/60', Icon: CameraOff },
  loading: { text: 'Дайындалуда…', cls: 'text-amber-300', Icon: Loader2 },
  tracking: { text: 'Қол көрінеді — ата бер!', cls: 'text-emerald-300', Icon: Hand },
  'no-hand': { text: 'Қолыңды камераға көрсет', cls: 'text-sky-300', Icon: Camera },
  unavailable: { text: 'Камера қолжетімсіз', cls: 'text-red-300', Icon: CameraOff },
};

/** Панель с подрезанными углами — вместо стеклянных скруглённых карточек по всему приложению */
const notch = { clipPath: 'polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)' };
const panel = 'relative bg-gradient-to-b from-[#2a1d10]/95 to-[#180f07]/95 border border-[#caa355]/45 shadow-[0_4px_24px_rgba(0,0,0,0.55)]';

export function ZhelayakHUD(p: Props) {
  const cam = CAMERA_LABEL[p.cameraStatus];
  const seconds = Math.ceil(p.timeLeftMs / 1000);
  const ratio = p.timeLimitMs > 0 ? p.timeLeftMs / p.timeLimitMs : 0;
  const urgent = p.timeLeftMs > 0 && p.timeLeftMs < 10_000;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 md:p-6 z-10">
      {/* Верх */}
      <div className="flex flex-wrap justify-between items-start gap-2 md:gap-3">
        <div className={`${panel} px-4 py-3 pointer-events-auto flex items-center gap-3`} style={notch}>
          <Link href="/" className="text-[#e7c67c]/70 hover:text-[#f2c14e] transition-colors" title="Далаға қайту">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-lg md:text-xl font-extrabold tracking-wide text-[#f2c14e] flex items-center gap-2">
              <Wind size={18} className="text-[#e7c67c]" /> ЖЕЛАЯҚ СЫНАҒЫ
            </h1>
            <p className="text-[#d8c7a1]/70 text-xs md:text-sm mt-0.5 whitespace-nowrap">Ер-Төстік ертегісі · қолмен ату</p>
          </div>
        </div>

        <div className={`${panel} px-2 py-1 md:px-3 md:py-2 flex items-stretch divide-x divide-[#caa355]/25 ml-auto`} style={notch}>
          <div className="px-3 py-1 flex flex-col items-center">
            <span className="text-[#d8c7a1]/60 text-[10px] uppercase tracking-wider flex items-center gap-1"><Target size={11} /> Ұпай</span>
            <span className="text-xl md:text-2xl font-bold text-[#f2c14e]">{p.score}</span>
          </div>
          <div className="px-3 py-1 flex flex-col items-center">
            <span className="text-[#d8c7a1]/60 text-[10px] uppercase tracking-wider flex items-center gap-1"><Flame size={11} /> Серия</span>
            <span className={`text-xl md:text-2xl font-bold flex items-center gap-1 ${p.streak > 2 ? 'text-orange-400' : 'text-[#f1e7d6]'}`}>
              {p.streak}
            </span>
          </div>
          <div className="px-3 py-1 flex flex-col items-center min-w-[4.5rem]">
            <span className="text-[#d8c7a1]/60 text-[10px] uppercase tracking-wider flex items-center gap-1"><Hourglass size={11} className={urgent ? 'text-red-400 animate-pulse' : ''} /> Уақыт</span>
            <span className={`text-xl md:text-2xl font-bold ${urgent ? 'text-red-400 animate-pulse' : 'text-[#f1e7d6]'}`}>{seconds}</span>
            <div className="w-full h-1 rounded-full bg-black/40 mt-1 overflow-hidden">
              <div className={`h-full transition-[width] duration-300 ${urgent ? 'bg-red-400' : 'bg-[#f2c14e]'}`} style={{ width: `${ratio * 100}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Свиток задания */}
      {p.activeSet && (
        <motion.div key={p.activeSet.id} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="absolute top-44 md:top-28 left-1/2 -translate-x-1/2 text-center max-w-[92vw]">
          <div className={`${panel} px-5 py-2.5 inline-block`} style={notch}>
            <p className="text-[#e7c67c]/70 text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5">
              <ScrollText size={11} /> аңыз · игерілді {p.masteredCount} / {p.totalSets}
            </p>
            <p className="text-[#f1e7d6] text-base md:text-lg mt-0.5">
              <span className="font-semibold text-[#f2c14e]">{p.activeSet.title}</span>
              <span className="text-[#d8c7a1]/60 ml-3">{p.answered} / {p.total}</span>
            </p>
          </div>
        </motion.div>
      )}

      {/* Низ */}
      <div className={`flex items-end justify-between gap-3 ${p.showCamera ? 'mr-48' : ''}`}>
        <div className="flex items-end gap-3">
          <div className={`${panel} px-4 py-3 pointer-events-auto max-w-xs`} style={notch}>
            {p.showCamera ? (
              <button onClick={p.onToggleCamera} className={`flex items-center gap-2 text-sm ${cam.cls}`} title="Камераны қосу/өшіру">
                <cam.Icon size={18} className={p.cameraStatus === 'loading' ? 'animate-spin' : ''} />
                <span>{cam.text}</span>
              </button>
            ) : (
              <span className="flex items-center gap-2 text-sm text-sky-300">
                <MousePointer2 size={18} /> Жанасу режимі
              </span>
            )}
            {p.cameraError && <p className="text-[#d8c7a1]/50 text-xs mt-1">{p.cameraError}</p>}
            {p.showCamera && !p.cameraError && (
              <p className="text-[#d8c7a1]/50 text-xs mt-1">
                {p.controlMode === 'pinch' ? 'Стреланы саусақпен қыс да, идолға қарай жібер' : 'Алақаныңды ашып, керек жаққа сермеп ат'}
              </p>
            )}
            {p.swipeDebug && p.controlMode === 'swipe' && (
              <p className="text-amber-300/70 text-[10px] font-mono mt-1">
                v {p.swipeDebug.speed.toFixed(1)} · ∠ {p.swipeDebug.angle.toFixed(0)}°
              </p>
            )}
          </div>

          {p.showCamera && (
            <div className={`${panel} p-1 pointer-events-auto flex text-sm`} style={notch}>
              {(['pinch', 'swipe'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => p.onControlMode(m)}
                  className={`px-3 py-2 transition-colors ${p.controlMode === m ? 'bg-[#f2c14e]/20 text-[#f2c14e]' : 'text-[#d8c7a1]/60 hover:text-[#f1e7d6]'}`}
                >
                  {m === 'pinch' ? 'Қысу' : 'Сермеу'}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-end gap-2 md:gap-3 pointer-events-auto">
          <button
            onClick={() => p.onHardMode(!p.hardMode)}
            className={`${panel} px-3 py-3 flex items-center gap-2 text-sm transition-colors ${p.hardMode ? 'text-red-300 bg-red-500/10' : 'text-[#d8c7a1]/60 hover:text-[#f1e7d6]'}`}
            style={notch}
            title="Қатал сынақ: қате жауапқа екінші мүмкіндік жоқ"
          >
            <Skull size={16} /> Қатал
          </button>
          <button onClick={p.onNextSet} className={`${panel} px-4 py-3 flex items-center gap-2 text-sm text-[#d8c7a1]/80 hover:text-[#f1e7d6] transition-colors whitespace-nowrap`} style={notch}>
            <Compass size={16} /> Басқа сынақ
          </button>
        </div>
      </div>

      {/* Қорытынды */}
      <AnimatePresence>
        {p.result && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto z-20"
          >
            <motion.div initial={{ scale: 0.92, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }} className={`${panel} p-8 w-[min(92vw,26rem)] text-center`} style={notch}>
              <Award size={40} className={`mx-auto mb-3 ${p.result.passed ? 'text-[#f2c14e]' : 'text-[#d8c7a1]/40'}`} />
              <h2 className="text-2xl font-bold text-[#f1e7d6]">{p.result.passed ? 'Сынақтан өттің!' : 'Тағы бір рет көр'}</h2>
              <p className="text-[#d8c7a1]/60 text-sm mt-1">{p.activeSet?.title}</p>
              <div className="grid grid-cols-3 gap-3 mt-6 text-[#f1e7d6]">
                <div><p className="text-3xl font-bold text-emerald-300">{p.result.correct}</p><p className="text-xs text-[#d8c7a1]/60">дұрыс</p></div>
                <div><p className="text-3xl font-bold text-red-300">{p.result.wrong}</p><p className="text-xs text-[#d8c7a1]/60">қате</p></div>
                <div><p className="text-3xl font-bold text-[#f2c14e]">{p.result.score}</p><p className="text-xs text-[#d8c7a1]/60">ұпай</p></div>
              </div>
              <p className="text-[#d8c7a1]/40 text-xs mt-4">
                {(p.result.timeSpentMs / 1000).toFixed(1)} с · режим: {p.result.controlMode === 'pinch' ? 'қысу' : 'сермеу'}
                {p.bestTimeMs !== null && <> · үздік реакция {(p.bestTimeMs / 1000).toFixed(2)} с</>}
              </p>
              <div className="flex gap-3 mt-6">
                <button onClick={p.onRestart} className="flex-1 flex items-center justify-center gap-2 bg-[#caa355]/15 hover:bg-[#caa355]/25 text-[#f1e7d6] py-3 transition-colors" style={notch}>
                  <RotateCcw size={16} /> Қайта көр
                </button>
                <button onClick={p.onNextSet} className="flex-1 flex items-center justify-center gap-2 bg-[#f2c14e]/80 hover:bg-[#f2c14e] text-[#1b130a] font-semibold py-3 transition-colors" style={notch}>
                  <Compass size={16} /> Басқа сынақ
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
