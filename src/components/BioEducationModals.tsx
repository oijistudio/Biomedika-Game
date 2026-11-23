import React, { useState } from 'react';
import { BookOpen, CheckCircle2, GraduationCap, Lock, X, XCircle } from 'lucide-react';
import { BIO_ENTRIES, BioQuizQuestion } from '../game/biologyData';

interface BioEncyclopediaModalProps {
  open: boolean;
  unlockedIds: string[];
  quizCorrectCount: number;
  onClose: () => void;
}

export const BioEncyclopediaModal: React.FC<BioEncyclopediaModalProps> = ({
  open,
  unlockedIds,
  quizCorrectCount,
  onClose,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-6"
      style={{ backgroundColor: 'rgba(4, 8, 16, 0.82)' }}
    >
      <div
        className="flex max-h-[88vh] w-full max-w-2xl flex-col rounded-2xl border border-cyan-500/35 text-slate-100 shadow-2xl"
        style={{ backgroundColor: 'rgba(8, 14, 26, 0.98)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700/70 px-5 py-4">
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-cyan-300" />
            <div>
              <h2 className="text-base font-extrabold tracking-wide text-cyan-200 uppercase sm:text-lg">
                Bio-Ensiklopedia B.I.O.-7
              </h2>
              <p className="text-xs text-slate-400">
                Terbuka: <strong className="tabular-nums text-emerald-300">{unlockedIds.length}</strong> / {BIO_ENTRIES.length} Entri · Kuis Tepat:{' '}
                <strong className="tabular-nums text-amber-300">{quizCorrectCount}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup Ensiklopedia"
            className="cursor-pointer rounded-lg border border-slate-600/70 p-2 text-slate-300 hover:border-cyan-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Entries List */}
        <div className="grid grid-cols-1 gap-3 overflow-y-auto p-5 sm:grid-cols-2">
          {BIO_ENTRIES.map((entry) => {
            const unlocked = unlockedIds.includes(entry.id);
            return (
              <div
                key={entry.id}
                className={`rounded-xl border p-4 ${
                  unlocked
                    ? 'border-cyan-500/30 bg-slate-900/75'
                    : 'border-slate-800 bg-slate-950/60 opacity-75'
                }`}
              >
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className="rounded bg-cyan-950/80 px-2 py-0.5 text-[10px] font-bold tracking-wider text-cyan-300 uppercase">
                    {entry.category}
                  </span>
                  {!unlocked && <Lock className="h-3.5 w-3.5 text-slate-500" />}
                </div>
                <h3 className="mb-1.5 text-sm font-bold text-white">
                  {unlocked ? entry.title : 'Data Biologi Terkunci'}
                </h3>
                <p className="text-xs leading-relaxed text-slate-300">
                  {unlocked
                    ? entry.detail
                    : 'Jelajahi zona anatomi dan basmi patogen terkait untuk memindai entri biologi ini.'}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

interface BioQuizModalProps {
  quiz: BioQuizQuestion | null;
  onAnswer: (choiceIndex: number) => { correct: boolean; explanation: string } | null;
  onDismiss: () => void;
}

export const BioQuizModal: React.FC<BioQuizModalProps> = ({ quiz, onAnswer, onDismiss }) => {
  const [result, setResult] = useState<{ chosen: number; correct: boolean; explanation: string } | null>(null);

  if (!quiz) return null;

  const handlePick = (idx: number) => {
    if (result) return;
    const isCorrect = idx === quiz.correctIndex;
    setResult({
      chosen: idx,
      correct: isCorrect,
      explanation: quiz.explanation,
    });
  };

  const handleContinue = () => {
    const chosen = result ? result.chosen : -1;
    setResult(null);
    if (chosen >= 0) {
      onAnswer(chosen);
    } else {
      onDismiss();
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(4, 8, 16, 0.78)' }}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-emerald-400/40 p-6 text-slate-100 shadow-2xl"
        style={{ backgroundColor: 'rgba(8, 15, 28, 0.97)' }}
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-300">
            <GraduationCap className="h-5 w-5" />
            <span className="text-xs font-extrabold tracking-widest uppercase">
              Kuis Bio Profesor Aris (Bonus +30% Hull &amp; +50 Energi)
            </span>
          </div>
        </div>

        <h3 className="mb-4 text-base font-bold leading-snug text-white sm:text-lg">
          {quiz.question}
        </h3>

        <div className="mb-4 flex flex-col gap-2.5">
          {quiz.options.map((opt, idx) => {
            const isPicked = result?.chosen === idx;
            const isAnswer = idx === quiz.correctIndex;
            let borderCls = 'border-slate-700 bg-slate-900/80 hover:border-cyan-400/70';
            if (result) {
              if (isAnswer) borderCls = 'border-emerald-400 bg-emerald-950/60 text-emerald-200';
              else if (isPicked) borderCls = 'border-rose-400 bg-rose-950/60 text-rose-200';
              else borderCls = 'border-slate-800 bg-slate-950/50 opacity-60';
            }
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handlePick(idx)}
                disabled={!!result}
                className={`flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors ${borderCls}`}
              >
                <span>{opt}</span>
                {result && isAnswer && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />}
                {result && isPicked && !isAnswer && <XCircle className="h-4 w-4 shrink-0 text-rose-400" />}
              </button>
            );
          })}
        </div>

        {result ? (
          <div className="flex flex-col gap-3">
            <div
              className={`rounded-xl border px-4 py-3 text-xs leading-relaxed ${
                result.correct
                  ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-200'
                  : 'border-amber-500/40 bg-amber-950/40 text-amber-200'
              }`}
            >
              {result.explanation}
            </div>
            <button
              type="button"
              onClick={handleContinue}
              className="w-full cursor-pointer rounded-xl bg-emerald-400 py-3 text-sm font-extrabold text-slate-950 uppercase hover:bg-emerald-300"
            >
              Lanjut ke Zona Berikutnya
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onDismiss}
            className="w-full cursor-pointer rounded-xl border border-slate-700 py-2.5 text-xs font-semibold text-slate-400 hover:text-slate-200"
          >
            Lewati Kuis
          </button>
        )}
      </div>
    </div>
  );
};
