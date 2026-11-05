import React, { useEffect, useState, useRef } from 'react';
import { DialogueNode, DialogueChoice, SpeakerId } from '../types/game';
import { soundEngine } from '../audio/SoundEngine';

interface DialogueBoxProps {
  node: DialogueNode;
  onAdvance: () => void;
  onSelectChoice: (choice: DialogueChoice) => void;
}

// Згенеровані піксельні портрети персонажів в інді-хорор стилі
const PORTRAIT_IMAGES: Record<SpeakerId, string> = {
  bob: '/src/assets/images/portrait_bob_pixel_1793900982888.jpg',
  susie: '/src/assets/images/portrait_susie_pixel_1793900982269.jpg',
  rebecca: '/src/assets/images/portrait_rebecca_pixel_1793900983463.jpg',
  jimmy: '/src/assets/images/portrait_jimmy_pixel_1793900984253.jpg',
  endro: '/src/assets/images/portrait_endro_pixel_1793900984170.jpg',
  endro_alive: '/src/assets/images/portrait_endro_alive_pixel_1793902817804.jpg',
  cat: '/src/assets/images/portrait_cat_pixel_1793902833195.jpg',
  system: ''
};

export const DialogueBox: React.FC<DialogueBoxProps> = ({
  node,
  onAdvance,
  onSelectChoice
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const textIndexRef = useRef(0);

  // Скидання та запуск друкарської машинки при зміні репліки
  useEffect(() => {
    setDisplayedText('');
    setIsTyping(true);
    textIndexRef.current = 0;

    const fullText = node.text;
    const interval = window.setInterval(() => {
      textIndexRef.current += 1;
      const current = fullText.slice(0, textIndexRef.current);
      setDisplayedText(current);

      const currentChar = fullText[textIndexRef.current - 1];
      if (textIndexRef.current % 2 === 0 && currentChar && currentChar !== ' ' && currentChar !== '\n') {
        soundEngine.playDialogueVoiceBeep(node.speaker, currentChar);
      }

      if (textIndexRef.current >= fullText.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 28);

    return () => clearInterval(interval);
  }, [node.id, node.text, node.speaker]);

  const handleInteraction = () => {
    if (isTyping) {
      setDisplayedText(node.text);
      setIsTyping(false);
    } else if (!node.choices || node.choices.length === 0) {
      soundEngine.playSelectSound();
      onAdvance();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        handleInteraction();
      } else if (!isTyping && node.choices && node.choices.length > 0) {
        if (e.key === '1' && node.choices[0]) {
          soundEngine.playSelectSound();
          onSelectChoice(node.choices[0]);
        } else if (e.key === '2' && node.choices[1]) {
          soundEngine.playSelectSound();
          onSelectChoice(node.choices[1]);
        } else if (e.key === '3' && node.choices[2]) {
          soundEngine.playSelectSound();
          onSelectChoice(node.choices[2]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTyping, node]);

  const getSpeakerLabel = (spk: SpeakerId): { name: string; role: string; border: string; glow: string } => {
    switch (spk) {
      case 'bob':
        return { 
          name: 'Боб', 
          role: '17 років · Головний герой', 
          border: 'border-amber-400/80', 
          glow: 'shadow-amber-500/20' 
        };
      case 'susie':
        return { 
          name: 'Сюзі', 
          role: 'Мати · Хвора й знесилена', 
          border: 'border-emerald-400/80', 
          glow: 'shadow-emerald-500/20' 
        };
      case 'rebecca':
        return { 
          name: 'Ребека', 
          role: 'Молодша сестра · 8 років', 
          border: 'border-pink-400/80', 
          glow: 'shadow-pink-500/20' 
        };
      case 'jimmy':
        return { 
          name: 'Джиммі', 
          role: 'Сусід · Підозрілий місцевий', 
          border: 'border-red-500/90', 
          glow: 'shadow-red-500/30' 
        };
      case 'endro':
        return { 
          name: 'Ендро', 
          role: 'Батько · Голос зі сну', 
          border: 'border-sky-400/90', 
          glow: 'shadow-sky-500/30' 
        };
      case 'endro_alive':
        return { 
          name: 'Ендро Блейк', 
          role: 'Оголошення про розшук · 42 роки', 
          border: 'border-amber-400/90', 
          glow: 'shadow-amber-500/30' 
        };
      case 'cat':
        return { 
          name: 'Вуличний кіт', 
          role: 'Ловець риби · Муркоче', 
          border: 'border-emerald-400/90', 
          glow: 'shadow-emerald-500/30' 
        };
      case 'system':
      default:
        return { 
          name: 'Тривога', 
          role: 'Внутрішнє відчуття', 
          border: 'border-slate-500/60', 
          glow: 'shadow-slate-500/10' 
        };
    }
  };

  const speakerInfo = getSpeakerLabel(node.speaker);
  const portraitUrl = PORTRAIT_IMAGES[node.speaker];

  return (
    <div 
      className="absolute bottom-5 left-1/2 -translate-x-1/2 w-[95%] max-w-3xl z-30 select-none cursor-pointer"
      onClick={handleInteraction}
    >
      <div className="relative rounded-2xl bg-slate-950/95 backdrop-blur-md border border-slate-700/80 p-4 md:p-6 shadow-2xl shadow-black transition-all">
        
        {/* Головний контейнер: піксельний портрет ліворуч + текст праворуч */}
        <div className="flex gap-4 md:gap-5 items-start">
          
          {/* Піксельний портрет мовця у ретро інді-стилі */}
          <div className="shrink-0 flex flex-col items-center">
            <div className={`relative w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden border-2 ${speakerInfo.border} ${speakerInfo.glow} shadow-xl bg-slate-900 group`}>
              {portraitUrl ? (
                <img 
                  src={portraitUrl} 
                  alt={speakerInfo.name}
                  referrerPolicy="no-referrer"
                  className={`w-full h-full object-cover transition-transform ${isTyping ? 'scale-[1.03]' : 'scale-100'}`}
                  style={{ imageRendering: 'pixelated' }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-900 text-red-400">
                  <svg className="w-10 h-10 animate-pulse" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L2 22h20L12 2zm1 14h-2v-2h2v2zm0-4h-2V8h2v4z" />
                  </svg>
                </div>
              )}

              {/* Мерехтіння/сканлайн ефект на портреті */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/10 pointer-events-none" />
              {isTyping && (
                <div className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              )}
            </div>

            {/* Ім'я мовця під портретом на мобільних або в рядку */}
            <span className="mt-1.5 text-xs font-bold tracking-wide text-slate-200 text-center">
              {speakerInfo.name}
            </span>
          </div>

          {/* Права частина: роль та текст діалогу */}
          <div className="flex-1 min-w-0">
            
            {/* Рядок статусу */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80">
              <span className="text-xs text-slate-400 font-medium tracking-wide">
                {speakerInfo.role}
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                {isTyping ? 'Друк...' : (!node.choices || node.choices.length === 0) ? '[Пробіл / Клік]' : 'Оберіть відповідь'}
              </span>
            </div>

            {/* Текст репліки */}
            <p className="text-slate-100 text-base md:text-lg leading-relaxed min-h-[52px]">
              {displayedText}
              {isTyping && <span className="inline-block w-2 h-4 ml-1 bg-amber-400 animate-pulse" />}
            </p>

            {/* Варіанти вибору */}
            {!isTyping && node.choices && node.choices.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col gap-2">
                {node.choices.map((choice, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      soundEngine.playSelectSound();
                      onSelectChoice(choice);
                    }}
                    className="group w-full text-left px-3.5 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 hover:border-amber-400 transition-all flex items-center justify-between text-slate-200 hover:text-white cursor-pointer"
                  >
                    <span className="text-sm md:text-base font-medium">
                      <span className="text-amber-400 font-mono mr-2">{idx + 1}.</span>
                      {choice.text}
                    </span>
                    <span className="text-xs text-slate-500 group-hover:text-amber-400 transition-colors">
                      ↵
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
