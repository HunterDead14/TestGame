import React, { useState } from 'react';
import { soundEngine } from '../audio/SoundEngine';

interface PauseMenuProps {
  onResume: () => void;
  onRestartChapter: () => void;
  onExitToMenu: () => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  onResume,
  onRestartChapter,
  onExitToMenu
}) => {
  const [volume, setVolume] = useState(soundEngine.getVolume());
  const [isMuted, setIsMuted] = useState(soundEngine.getIsMuted());

  const handleVolumeChange = (newVal: number) => {
    setVolume(newVal);
    soundEngine.setVolume(newVal);
  };

  const handleToggleMute = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-sm w-full p-6 space-y-6 shadow-2xl">
        <h2 className="text-2xl font-cinzel font-bold text-slate-100 tracking-wider text-center">
          ПАУЗА
        </h2>

        {/* Налаштування звуку під час гри */}
        <div className="space-y-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Гучність</span>
            <span className="font-mono">{Math.round(volume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
          />

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-slate-300">Звук</span>
            <button
              type="button"
              onClick={handleToggleMute}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                isMuted ? 'bg-red-900/60 text-red-200 border border-red-700' : 'bg-slate-800 text-slate-300'
              }`}
            >
              {isMuted ? 'Вимкнено' : 'Увімкнено'}
            </button>
          </div>
        </div>

        {/* Кнопки дій */}
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => {
              soundEngine.playSelectSound();
              onResume();
            }}
            className="w-full py-3 px-4 rounded-xl bg-amber-500/90 hover:bg-amber-400 text-slate-950 font-bold text-sm tracking-wider transition-all cursor-pointer shadow-lg"
          >
            ПРОДОВЖИТИ ГРУ
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playSelectSound();
              onRestartChapter();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-medium text-xs tracking-wider transition-all cursor-pointer"
          >
            Почати розділ спочатку
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playSelectSound();
              onExitToMenu();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-red-400 font-medium text-xs tracking-wider transition-all cursor-pointer"
          >
            Вийти в головне меню
          </button>
        </div>
      </div>
    </div>
  );
};
