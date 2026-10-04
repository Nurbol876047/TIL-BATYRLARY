'use client';

import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Award, Camera, CameraOff, Hand, Hourglass, Loader2, Mountain, MousePointer2, RotateCcw, Target, Zap } from 'lucide-react';
import type { HandTrackingStatus } from '@/hooks/hand/useMediaPipeHands';
import type { TolagaiItem } from '@/lib/tolagai/items';
import { TOLAGAI_OPTIONS, type TolagaiResult } from '@/store/tolagaiStore';
import { OptionButton } from './OptionButton';
import { HandCursorDot } from './HandCursorDot';

interface Props {
  current: TolagaiItem | null;
  selectedIndex: number | null;
  answered: boolean;
  score: number;
  streak: number;
  timeLeftMs: number;
  timeLimitMs: number;
  correctCount: number;
  wrongCount: number;
  totalWords: number;
  cameraStatus: HandTrackingStatus;
  cameraError: string | null;
  showCamera: boolean;
  onToggleCamera: () => void;
  result: TolagaiResult | null;
  onRestart: () => void;
  onAnswer: (index: number) => void;
}

const CAMERA_LABEL: Record<HandTrackingStatus, { text: string; cls: string; Icon: typeof Camera }> = {
  idle: { text: 'Камера өшірулі', cls: 'text-white/50', Icon: CameraOff },
  loading: { text: 'Іске қосылуда…', cls: 'text-amber-300', Icon: Loader2 },
  tracking: { text: 'Қолыңды көрсетіп, жауапты қыс', cls: 'text-emerald-300', Icon: Hand },
  'no-hand': { text: 'Қолыңды камераға көрсет', cls: 'text-sky-300', Icon: Camera },
  unavailable: { text: 'Камера қолжетімсіз', cls: 'text-red-300', Icon: CameraOff },
};

/** Угловатые, прямолинейные панели — под стать гранёным трещинам силы */
const notch = { clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' };
const panel = 'bg-[#1c140d]/80 backdrop-blur-md border border-[#f2a341]/25 shadow-xl';

export function TolagaiQuiz(p: Props) {
  const cam = CAMERA_LABEL[p.cameraStatus];
  const seconds = Math.ceil(p.timeLeftMs / 1000);
  const ratio = p.timeLimitMs > 0 ? p.timeLeftMs / p.timeLimitMs : 0;
  const urgent = p.timeLeftMs > 0 && p.timeLeftMs < 10_000;
  const correctOptionIndex = p.current ? TOLAGAI_OPTIONS.findIndex((o) => o.id === p.current!.category) : -1;

  return (
    <div className="absolute inset-0 flex flex-col justify-between p-4 md:p-6 z-10">
      {/* Верх */}
      <div className="flex flex-wrap justify-between items-start gap-2 md:gap-3">
        <div className={`${panel} px-4 py-3 flex items-center gap-3`} style={notch}>
          <Link href="/" className="text-[#f2d9b8]/70 hover:text-[#f2d9b8] transition-colors" title="Далаға қайту">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-lg md:text-xl font-extrabold tracking-wide text-[#f2d9b8] flex items-center gap-2">
              <Mountain size={18} /> ТОЛАҒАЙ СЫНАҒЫ
            </h1>
            <p className="text-[#f2d9b8]/60 text-xs md:text-sm mt-0.5">Ер-Төстік ертегісі · қолмен бас</p>
          </div>
        </div>

        <div className={`${panel} px-2 py-1 md:px-3 md:py-2 flex items-stretch divide-x divide-[#f2a341]/20 ml-auto`} style={notch}>
          <div className="px-3 py-1 flex flex-col items-center">
            <span className="text-[#f2d9b8]/50 text-[10px] uppercase tracking-wider flex items-center gap-1"><Target size={11} /> Ұпай</span>
            <span className="text-xl md:text-2xl font-bold text-[#f2a341]">{p.score}</span>
          </div>
          <div className="px-3 py-1 flex flex-col items-center">
            <span className="text-[#f2d9b8]/50 text-[10px] uppercase tracking-wider flex items-center gap-1"><Zap size={11} /> Серия</span>
            <span className={`text-xl md:text-2xl font-bold ${p.streak > 2 ? 'text-orange-400' : 'text-[#f2d9b8]'}`}>{p.streak}</span>
          </div>
          <div className="px-3 py-1 flex flex-col items-center min-w-[4.5rem]">
            <span className="text-[#f2d9b8]/50 text-[10px] uppercase tracking-wider flex items-center gap-1"><Hourglass size={11} className={urgent ? 'text-red-400 animate-pulse' : ''} /> Уақыт</span>
            <span className={`text-xl md:text-2xl font-bold ${urgent ? 'text-red-400 animate-pulse' : 'text-[#f2d9b8]'}`}>{seconds}</span>
            <div className="w-full h-1 rounded-full bg-black/40 mt-1 overflow-hidden">
              <div className={`h-full transition-[width] duration-300 ${urgent ? 'bg-red-400' : 'bg-[#f2a341]'}`} style={{ width: `${ratio * 100}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Вопрос и варианты ответа */}
      <div className="flex-1 min-h-0 flex items-center justify-center py-4">
        <div className="w-full max-w-4xl flex flex-col items-center gap-10">
          <AnimatePresence mode="wait">
            {p.current && (
              <motion.div
                key={p.current.text}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className={`${panel} px-8 py-7 md:px-12 md:py-9 text-center w-full`}
                style={notch}
              >
                <p className="text-[#f2d9b8]/50 text-xs uppercase tracking-widest mb-3">{p.correctCount + p.wrongCount + 1} / {p.totalWords}</p>
                <p className="text-[#f8ede0] text-2xl md:text-3xl font-semibold leading-snug">{p.current.text}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-wrap justify-center gap-6 md:gap-10 w-full">
            {TOLAGAI_OPTIONS.map((opt, i) => (
              <OptionButton
                key={opt.id}
                index={i}
                label={opt.label}
                answered={p.answered}
                isSelected={p.selectedIndex === i}
                isCorrect={p.answered && i === correctOptionIndex}
                onSelect={() => p.onAnswer(i)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Низ: статус камеры */}
      <div className="flex items-end justify-start">
        <div className={`${panel} px-4 py-3 max-w-xs`} style={notch}>
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
          {p.cameraError && <p className="text-[#f2d9b8]/40 text-xs mt-1">{p.cameraError}</p>}
        </div>
      </div>

      <HandCursorDot />

      {/* Қорытынды */}
      <AnimatePresence>
        {p.result && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-20"
          >
            <motion.div initial={{ scale: 0.92, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }} className={`${panel} p-8 w-[min(92vw,26rem)] text-center`} style={notch}>
              <Award size={40} className={`mx-auto mb-3 ${p.result.passed ? 'text-[#f2a341]' : 'text-[#f2d9b8]/30'}`} />
              <h2 className="text-2xl font-bold text-[#f8ede0]">{p.result.passed ? 'Сынақтан өттің!' : 'Тағы бір рет көр'}</h2>
              <div className="grid grid-cols-3 gap-3 mt-6 text-[#f8ede0]">
                <div><p className="text-3xl font-bold text-emerald-300">{p.result.correct}</p><p className="text-xs text-[#f2d9b8]/50">дұрыс</p></div>
                <div><p className="text-3xl font-bold text-red-300">{p.result.wrong}</p><p className="text-xs text-[#f2d9b8]/50">қате</p></div>
                <div><p className="text-3xl font-bold text-[#f2a341]">{p.result.score}</p><p className="text-xs text-[#f2d9b8]/50">ұпай</p></div>
              </div>
              <button onClick={p.onRestart} className="mt-6 w-full flex items-center justify-center gap-2 bg-[#f2a341]/20 hover:bg-[#f2a341]/30 text-[#f8ede0] py-3 transition-colors" style={notch}>
                <RotateCcw size={16} /> Қайта көр
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
