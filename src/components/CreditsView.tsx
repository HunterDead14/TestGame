import React from 'react';
import { soundEngine } from '../audio/SoundEngine';

interface CreditsViewProps {
  onPlayAgain: () => void;
}

export const CreditsView: React.FC<CreditsViewProps> = ({ onPlayAgain }) => {
  return (
    <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center p-6 text-center select-none overflow-y-auto">
      <div className="max-w-xl w-full space-y-6 my-auto py-8">
        
        {/* Крупний план / фокус фіналу */}
        <div className="space-y-3">
          <div className="w-16 h-16 mx-auto rounded-full bg-slate-900 border border-red-500/50 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>

          <h1 className="text-3xl md:text-5xl font-cinzel font-black tracking-widest text-slate-100">
            «НЕ ДИВИСЬ У ЗЕМЛЮ»
          </h1>
          <div className="text-xs font-mono uppercase tracking-[0.3em] text-red-500">
            Кінець першого розділу
          </div>
        </div>

        <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-slate-600 to-transparent mx-auto" />

        <div className="text-slate-300 text-sm md:text-base leading-relaxed space-y-3 font-light max-w-lg mx-auto">
          <p>
            Правда відкрилася надто пізно. Джиммі не просто сусід — він безжальний душогуб, чия лопата обірвала життя Ендро.
          </p>
          <p className="text-slate-400 italic">
            «Тепер ти знаєш, синку... Бережи матір і Ребеку...»
          </p>
          <p className="text-xs text-slate-500 pt-2">
            Боб стоїть біля вікна, стискаючи холодні кулаки. Попереду — довга боротьба за виживання власної сім'ї.
          </p>
        </div>

        <div className="pt-6">
          <button
            type="button"
            onClick={() => {
              soundEngine.playSelectSound();
              onPlayAgain();
            }}
            className="py-3.5 px-8 rounded-xl bg-amber-500/90 hover:bg-amber-400 text-slate-950 font-bold text-sm tracking-widest transition-all cursor-pointer shadow-lg hover:shadow-amber-500/20"
          >
            ГРАТИ ЗНОВУ
          </button>
        </div>

        <div className="text-[11px] text-slate-600 font-mono tracking-widest pt-4">
          Дякуємо за гру!
        </div>
      </div>
    </div>
  );
};
