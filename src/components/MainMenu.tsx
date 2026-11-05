import React, { useState } from 'react';
import { SaveData } from '../types/game';
import { CHAPTERS_DATA } from '../story/script';
import { soundEngine } from '../audio/SoundEngine';

interface MainMenuProps {
  onStartNewGame: () => void;
  onContinueGame: () => void;
  saveData: SaveData | null;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onStartNewGame,
  onContinueGame,
  saveData
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [volume, setVolume] = useState(soundEngine.getVolume());
  const [isMuted, setIsMuted] = useState(soundEngine.getIsMuted());

  const handleStartNew = () => {
    soundEngine.init();
    soundEngine.playSelectSound();
    onStartNewGame();
  };

  const handleContinue = () => {
    soundEngine.init();
    soundEngine.playSelectSound();
    onContinueGame();
  };

  const handleVolumeChange = (newVal: number) => {
    setVolume(newVal);
    soundEngine.setVolume(newVal);
  };

  const handleToggleMute = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="relative w-full h-full bg-black flex flex-col items-center justify-center select-none overflow-hidden p-6">
      
      {/* Атмосферний фон: туманні шари та легкий шум */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#04060d] via-[#090d1a] to-[#030408] opacity-95" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-900/10 via-transparent to-black pointer-events-none" />
      <div className="absolute inset-0 animate-grain pointer-events-none opacity-40 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

      {/* Центральний блок меню */}
      <div className="relative z-10 max-w-md w-full text-center space-y-8">
        
        {/* Заголовок гри */}
        <div className="space-y-3">
          <div className="text-xs uppercase tracking-[0.4em] text-red-500 font-mono">
            Психологічний інді-хорор
          </div>
          <h1 className="text-4xl md:text-6xl font-cinzel font-black tracking-widest text-slate-100 drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]">
            НЕ ДИВИСЬ<br />У ЗЕМЛЮ
          </h1>
          <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-red-600/80 to-transparent mx-auto" />
          <p className="text-xs md:text-sm text-slate-400 font-light max-w-xs mx-auto">
            Темрява лісу приховує те, що не варто було знаходити.
          </p>
        </div>

        {/* Кнопки вибору */}
        <div className="flex flex-col gap-3 max-w-xs mx-auto">
          <button
            type="button"
            onClick={handleStartNew}
            className="w-full py-3.5 px-6 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/60 hover:border-amber-400 text-slate-100 hover:text-amber-300 font-semibold tracking-wider transition-all shadow-lg hover:shadow-amber-500/10 cursor-pointer"
          >
            НОВА ГРА
          </button>

          {saveData && (
            <button
              type="button"
              onClick={handleContinue}
              className="w-full py-3.5 px-6 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/60 hover:border-amber-400 text-slate-100 hover:text-amber-300 font-semibold tracking-wider transition-all shadow-lg cursor-pointer flex flex-col items-center"
            >
              <span>ПРОДОВЖИТИ</span>
              <span className="text-[11px] text-slate-400 font-normal">
                {CHAPTERS_DATA[saveData.chapter].title} — «{CHAPTERS_DATA[saveData.chapter].subtitle}»
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              soundEngine.playSelectSound();
              setShowSettings(true);
            }}
            className="w-full py-3 px-6 rounded-xl bg-slate-950/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-600 text-slate-300 hover:text-white font-medium tracking-wide transition-all cursor-pointer"
          >
            Налаштування звуку
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playSelectSound();
              setShowAbout(true);
            }}
            className="w-full py-3 px-6 rounded-xl bg-slate-950/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-600 text-slate-400 hover:text-slate-200 text-xs font-medium tracking-wide transition-all cursor-pointer"
          >
            Про гру та керування
          </button>
        </div>

        <div className="text-[11px] text-slate-600 font-mono tracking-widest">
          React · TypeScript · HTML5 Canvas · Web Audio API
        </div>
      </div>

      {/* Модальне вікно налаштувань */}
      {showSettings && (
        <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-sm w-full p-6 space-y-6 shadow-2xl">
            <h2 className="text-xl font-cinzel font-bold text-slate-100 tracking-wider text-center">
              Налаштування звуку
            </h2>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-2">
                  <span>Загальна гучність</span>
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
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-sm text-slate-300">Вимкнути весь звук</span>
                <button
                  type="button"
                  onClick={handleToggleMute}
                  className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    isMuted ? 'bg-red-900/60 text-red-200 border border-red-700' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {isMuted ? 'Вимкнено' : 'Увімкнено'}
                </button>
              </div>

              <div className="text-xs text-slate-500 bg-slate-900/60 p-3 rounded-lg leading-relaxed">
                Усі аудіоефекти, дощ, серцебиття та мелодії генеруються в реальному часі через браузерний синтезатор Web Audio API.
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                soundEngine.playSelectSound();
                setShowSettings(false);
              }}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm transition-colors cursor-pointer"
            >
              Закрити
            </button>
          </div>
        </div>
      )}

      {/* Модальне вікно «Про гру та керування» */}
      {showAbout && (
        <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <h2 className="text-xl font-cinzel font-bold text-slate-100 tracking-wider text-center">
              Керування та деталі
            </h2>

            <div className="text-xs text-slate-300 space-y-3 leading-relaxed">
              <div className="p-3 bg-slate-900/80 rounded-xl space-y-2 border border-slate-800">
                <div className="font-semibold text-amber-300 uppercase tracking-wider text-[11px]">Керування на ПК:</div>
                <div className="grid grid-cols-2 gap-2 text-slate-400">
                  <div><kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-200">A</kbd> / <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-200">D</kbd> або Стрілки</div>
                  <div>Рух персонажа</div>
                  <div><kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-200">E</kbd></div>
                  <div>Взаємодія з точками</div>
                  <div><kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-200">Space</kbd> / Клік</div>
                  <div>Пропуск тексту</div>
                  <div><kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-200">1</kbd>, <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-200">2</kbd>, <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-200">3</kbd></div>
                  <div>Вибір реплік</div>
                </div>
              </div>

              <div className="p-3 bg-slate-900/80 rounded-xl space-y-1 border border-slate-800">
                <div className="font-semibold text-amber-300 uppercase tracking-wider text-[11px]">Мобільні пристрої:</div>
                <div className="text-slate-400">
                  Використовуйте наекранні віртуальні кнопки зі стрілками для руху та кнопку «E» для дій і вибору.
                </div>
              </div>

              <div className="text-slate-500 text-[11px]">
                Гра містить психологічну напругу, раптові аудіовізуальні глітчі та несподівані сюжетні повороти.
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                soundEngine.playSelectSound();
                setShowAbout(false);
              }}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm transition-colors cursor-pointer"
            >
              Зрозуміло
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
