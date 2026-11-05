import React from 'react';

interface TouchControlsProps {
  onMoveLeftStart: () => void;
  onMoveLeftEnd: () => void;
  onMoveRightStart: () => void;
  onMoveRightEnd: () => void;
  onActionClick: () => void;
  isNearHotspot?: boolean;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onMoveLeftStart,
  onMoveLeftEnd,
  onMoveRightStart,
  onMoveRightEnd,
  onActionClick,
  isNearHotspot
}) => {
  return (
    <div className="md:hidden fixed inset-x-0 bottom-3 px-4 z-20 pointer-events-none flex justify-between items-end">
      {/* Кнопки руху вліво та вправо */}
      <div className="flex gap-3 pointer-events-auto">
        <button
          type="button"
          onTouchStart={(e) => { e.preventDefault(); onMoveLeftStart(); }}
          onTouchEnd={(e) => { e.preventDefault(); onMoveLeftEnd(); }}
          onMouseDown={onMoveLeftStart}
          onMouseUp={onMoveLeftEnd}
          className="w-14 h-14 rounded-2xl bg-slate-900/80 active:bg-amber-500/30 border border-slate-700/60 active:border-amber-400 flex items-center justify-center text-slate-300 active:text-amber-300 shadow-lg backdrop-blur-sm transition-all select-none"
          aria-label="Вліво"
        >
          <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <button
          type="button"
          onTouchStart={(e) => { e.preventDefault(); onMoveRightStart(); }}
          onTouchEnd={(e) => { e.preventDefault(); onMoveRightEnd(); }}
          onMouseDown={onMoveRightStart}
          onMouseUp={onMoveRightEnd}
          className="w-14 h-14 rounded-2xl bg-slate-900/80 active:bg-amber-500/30 border border-slate-700/60 active:border-amber-400 flex items-center justify-center text-slate-300 active:text-amber-300 shadow-lg backdrop-blur-sm transition-all select-none"
          aria-label="Вправо"
        >
          <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* Кнопка взаємодії / Дія (E) */}
      <div className="pointer-events-auto">
        <button
          type="button"
          onClick={onActionClick}
          className={`w-16 h-16 rounded-full flex flex-col items-center justify-center shadow-xl backdrop-blur-md transition-all select-none ${
            isNearHotspot
              ? 'bg-amber-500/90 active:bg-amber-400 text-slate-950 font-bold border-2 border-amber-300 shadow-amber-500/40 animate-pulse'
              : 'bg-slate-900/80 active:bg-slate-800 text-slate-300 border border-slate-700/60'
          }`}
          aria-label="Взаємодіяти"
        >
          <span className="text-sm font-black tracking-tight leading-none">E</span>
          <span className="text-[10px] uppercase font-semibold tracking-wider mt-0.5 leading-none">Дія</span>
        </button>
      </div>
    </div>
  );
};
