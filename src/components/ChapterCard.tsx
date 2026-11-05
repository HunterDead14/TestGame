import React, { useEffect } from 'react';
import { ChapterMeta } from '../story/script';
import { soundEngine } from '../audio/SoundEngine';

interface ChapterCardProps {
  meta: ChapterMeta;
  onFinished: () => void;
}

export const ChapterCard: React.FC<ChapterCardProps> = ({ meta, onFinished }) => {
  useEffect(() => {
    // Автоматичний перехід через 3.5 секунди або раніше на клавішу
    const timer = window.setTimeout(() => {
      onFinished();
    }, 3800);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyE') {
        soundEngine.playSelectSound();
        onFinished();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onFinished]);

  return (
    <div 
      onClick={onFinished}
      className="absolute inset-0 z-40 bg-black flex flex-col items-center justify-center p-6 select-none cursor-pointer animate-fade-in"
    >
      <div className="max-w-md text-center space-y-4">
        <div className="text-xs md:text-sm font-mono uppercase tracking-[0.3em] text-slate-500">
          {meta.title}
        </div>
        
        <h1 className="text-3xl md:text-5xl font-cinzel font-bold text-slate-100 tracking-wider">
          «{meta.subtitle}»
        </h1>

        <div className="w-16 h-0.5 bg-amber-500/60 mx-auto my-3" />

        <p className="text-sm md:text-base text-slate-400 font-light italic">
          {meta.number === 1 && 'Кошмар, що пахне вогкою цвинтарною землею.'}
          {meta.number === 2 && 'Тепле світло дому посеред тривожної темряви.'}
          {meta.number === 3 && 'Дорога крізь ліс, де кожен шепіт здається знайомим.'}
          {meta.number === 4 && 'Вогні вітрин і страшна правда, схована між дерев.'}
          {meta.number === 5 && 'Порятунок для рідних, але спокій втрачено назавжди.'}
          {meta.number === 6 && 'Місце, де сходяться сон і жорстока дійсність.'}
          {meta.number === 7 && 'Коли розплющуєш очі, але кошмар не зникає.'}
        </p>

        <div className="pt-8 text-xs text-slate-600 font-mono tracking-widest animate-pulse">
          [ Натисніть будь-де, щоб продовжити ]
        </div>
      </div>
    </div>
  );
};
