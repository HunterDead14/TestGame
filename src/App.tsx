/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  GameState, 
  ChapterNumber, 
  GameFlags, 
  DialogueNode, 
  DialogueChoice, 
  Hotspot, 
  SaveData 
} from './types/game';
import { CHAPTERS_DATA, DIALOGUES, HOTSPOTS_BY_CHAPTER } from './story/script';
import { soundEngine } from './audio/SoundEngine';
import { GameRenderer, RenderState } from './game/GameRenderer';
import { DialogueBox } from './components/DialogueBox';
import { TouchControls } from './components/TouchControls';
import { ChapterCard } from './components/ChapterCard';
import { MainMenu } from './components/MainMenu';
import { PauseMenu } from './components/PauseMenu';
import { CreditsView } from './components/CreditsView';

const SAVE_KEY = 'dont_look_into_ground_save_v1';

export default function App() {
  // Стани гри
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [currentChapter, setCurrentChapter] = useState<ChapterNumber>(1);
  const [anxiety, setAnxiety] = useState<number>(20);
  const [flags, setFlags] = useState<GameFlags>({});
  const [inventory, setInventory] = useState<string[]>([]);
  const [saveData, setSaveData] = useState<SaveData | null>(null);

  // Стан персонажа
  const [playerX, setPlayerX] = useState<number>(180);
  const [playerFacing, setPlayerFacing] = useState<'left' | 'right'>('right');
  const [isMoving, setIsMoving] = useState<boolean>(false);

  // Діалог та точки інтересу
  const [activeDialogue, setActiveDialogue] = useState<DialogueNode | null>(null);
  const [nearbyHotspot, setNearbyHotspot] = useState<Hotspot | null>(null);

  // Спецефекти
  const [redFlashAmount, setRedFlashAmount] = useState<number>(0);
  const [glitchAmount, setGlitchAmount] = useState<number>(0);
  const [shakeAmount, setShakeAmount] = useState<number>(0);

  // Спеціальні пози персонажа
  const [isPettingCat, setIsPettingCat] = useState<boolean>(false);
  const [isPlayerDown, setIsPlayerDown] = useState<boolean>(false);

  // Рефи для ігрового циклу
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<GameRenderer | null>(null);
  const keysRef = useRef<{ left: boolean; right: boolean; shift: boolean }>({ left: false, right: false, shift: false });
  const touchMoveRef = useRef<{ left: boolean; right: boolean }>({ left: false, right: false });
  const lastFootstepTimeRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(performance.now());
  const animationFrameIdRef = useRef<number | null>(null);

  // Рефи синхронізації для requestAnimationFrame
  const playerXRef = useRef<number>(180);
  const playerFacingRef = useRef<'left' | 'right'>('right');
  const isMovingRef = useRef<boolean>(false);
  const chapterRef = useRef<ChapterNumber>(1);
  const anxietyRef = useRef<number>(20);
  const activeDialogueRef = useRef<DialogueNode | null>(null);
  const flagsRef = useRef<GameFlags>({});
  const inventoryRef = useRef<string[]>([]);

  // Синхронізація рефів зі стейтом
  useEffect(() => { playerXRef.current = playerX; }, [playerX]);
  useEffect(() => { playerFacingRef.current = playerFacing; }, [playerFacing]);
  useEffect(() => { isMovingRef.current = isMoving; }, [isMoving]);
  useEffect(() => { chapterRef.current = currentChapter; }, [currentChapter]);
  useEffect(() => { anxietyRef.current = anxiety; }, [anxiety]);
  useEffect(() => { activeDialogueRef.current = activeDialogue; }, [activeDialogue]);
  useEffect(() => { flagsRef.current = flags; }, [flags]);
  useEffect(() => { inventoryRef.current = inventory; }, [inventory]);

  // Завантаження збереження при старті
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as SaveData;
        setSaveData(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  // Автозбереження
  const saveCurrentProgress = useCallback((ch: ChapterNumber, anx: number, flg: GameFlags, inv: string[], px: number) => {
    const data: SaveData = {
      chapter: ch,
      anxiety: anx,
      flags: flg,
      inventory: inv,
      playerX: px,
      timestamp: Date.now()
    };
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      setSaveData(data);
    } catch {
      // ignore
    }
  }, []);

  // Ініціалізація Canvas Renderer
  useEffect(() => {
    if (!canvasRef.current) return;
    try {
      rendererRef.current = new GameRenderer(canvasRef.current);
    } catch (e) {
      console.error('Renderer init error:', e);
    }

    const handleResize = () => {
      rendererRef.current?.resize();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [gameState]);

  // Запуск розділу
  const setupChapter = useCallback((chNumber: ChapterNumber, resumeX?: number) => {
    const meta = CHAPTERS_DATA[chNumber];
    const startX = resumeX ?? meta.playerStartX;

    setCurrentChapter(chNumber);
    setPlayerX(startX);
    playerXRef.current = startX;
    setPlayerFacing('right');
    playerFacingRef.current = 'right';

    // Скидання будь-яких залишкових ефектів тряски, спалахів та спеціальних поз
    setShakeAmount(0);
    setRedFlashAmount(0);
    setGlitchAmount(0);
    setIsPettingCat(false);
    setIsPlayerDown(false);

    // Встановлення звуку для середовища розділу
    soundEngine.setAtmosphere(meta.environment, meta.ambientAnxiety);

    // Показ титрів розділу
    setGameState('CHAPTER_CARD');

    // Початковий діалог
    if (meta.initialDialogueId) {
      const initDiag = DIALOGUES[meta.initialDialogueId];
      if (initDiag) {
        setActiveDialogue(initDiag);
      }
    } else {
      setActiveDialogue(null);
    }
  }, []);

  // Старт нової гри
  const startNewGame = useCallback(() => {
    localStorage.removeItem(SAVE_KEY);
    setSaveData(null);
    setFlags({});
    setInventory([]);
    setAnxiety(CHAPTERS_DATA[1].ambientAnxiety);
    setupChapter(1);
  }, [setupChapter]);

  // Продовжити збережену гру
  const continueGame = useCallback(() => {
    if (!saveData) return;
    setFlags(saveData.flags);
    setInventory(saveData.inventory);
    setAnxiety(saveData.anxiety);
    setupChapter(saveData.chapter, saveData.playerX);
  }, [saveData, setupChapter]);

  // Обробка ефектів діалогу (тривога, глітч, спалах, звук, збиття з ніг)
  const triggerDialogueEffects = useCallback((node: DialogueNode) => {
    if (node.anxietyDelta) {
      setAnxiety(prev => {
        const next = Math.max(0, Math.min(100, prev + node.anxietyDelta!));
        soundEngine.setAnxiety(next);
        return next;
      });
    }

    if (node.triggerEffect === 'glitch') {
      setGlitchAmount(1);
      setTimeout(() => setGlitchAmount(0), 450);
    } else if (node.triggerEffect === 'red_flash') {
      setRedFlashAmount(0.85);
      setTimeout(() => setRedFlashAmount(0), 550);
    } else if (node.triggerEffect === 'stinger') {
      setRedFlashAmount(0.6);
      setGlitchAmount(1);
      setShakeAmount(1);
      soundEngine.playStinger();
      setTimeout(() => {
        setRedFlashAmount(0);
        setGlitchAmount(0);
        setShakeAmount(0);
      }, 350);
    } else if (node.triggerEffect === 'whisper') {
      soundEngine.playWhisperSound();
    } else if (node.triggerEffect === 'heavy_hit') {
      soundEngine.playHeavyHit();
      setIsPlayerDown(true); // БОБ ПАДАЄ ВІД УДАРУ ЛОПАТОЮ
      setShakeAmount(2.0);
      setRedFlashAmount(0.9);
      setTimeout(() => {
        setShakeAmount(0);
        setRedFlashAmount(0);
      }, 450);
    }

    if (node.soundCue === 'stinger') soundEngine.playStinger();
    if (node.soundCue === 'whisper') soundEngine.playWhisperSound();
    if (node.soundCue === 'heavy_hit') {
      soundEngine.playHeavyHit();
      setIsPlayerDown(true);
    }
    if (node.soundCue === 'cat_purr') {
      soundEngine.playCatPurr();
    }

    if (node.inventoryAdd) {
      setInventory(prev => prev.includes(node.inventoryAdd!) ? prev : [...prev, node.inventoryAdd!]);
    }
    if (node.inventoryRemove) {
      setInventory(prev => prev.filter(item => item !== node.inventoryRemove));
    }
  }, []);

  // Перехід між репліками
  const handleAdvanceDialogue = useCallback(() => {
    if (!activeDialogue) return;

    if (isPettingCat) {
      setIsPettingCat(false);
    }

    if (activeDialogue.endChapterOnComplete) {
      setActiveDialogue(null);
      const nextCh = (currentChapter + 1) as ChapterNumber;
      if (nextCh <= 7) {
        setupChapter(nextCh);
        saveCurrentProgress(nextCh, anxiety, flags, inventory, CHAPTERS_DATA[nextCh].playerStartX);
      } else {
        setGameState('CREDITS');
      }
      return;
    }

    if (activeDialogue.nextDialogueId) {
      const nextNode = DIALOGUES[activeDialogue.nextDialogueId];
      if (nextNode) {
        triggerDialogueEffects(nextNode);
        setActiveDialogue(nextNode);
      } else {
        setActiveDialogue(null);
      }
    } else {
      setActiveDialogue(null);
    }
  }, [activeDialogue, currentChapter, anxiety, flags, inventory, isPettingCat, setupChapter, saveCurrentProgress, triggerDialogueEffects]);

  // Вибір варіанта в діалозі
  const handleSelectChoice = useCallback((choice: DialogueChoice) => {
    if (choice.flagKey && choice.flagValue) {
      const updatedFlags = { ...flags, [choice.flagKey]: choice.flagValue };
      setFlags(updatedFlags);
      flagsRef.current = updatedFlags;
    }

    if (choice.anxietyDelta) {
      setAnxiety(prev => {
        const next = Math.max(0, Math.min(100, prev + choice.anxietyDelta!));
        soundEngine.setAnxiety(next);
        return next;
      });
    }

    const nextNode = DIALOGUES[choice.nextDialogueId];
    if (nextNode) {
      triggerDialogueEffects(nextNode);
      setActiveDialogue(nextNode);
    } else {
      setActiveDialogue(null);
    }
  }, [flags, triggerDialogueEffects]);

  // Взаємодія з інтерактивною точкою (клавіша E або тач)
  const triggerHotspotInteraction = useCallback(() => {
    if (activeDialogue || !nearbyHotspot) return;

    soundEngine.playSelectSound();

    let targetDialogueId = nearbyHotspot.dialogueId;

    // Спеціальні динамічні маршрутизації за прапорцями
    if (nearbyHotspot.id === 'cat_spot') {
      setIsPettingCat(true);
      soundEngine.playCatPurr();
      setAnxiety(prev => Math.max(0, prev - 15));
      soundEngine.setAnxiety(Math.max(0, anxiety - 15));
      setTimeout(() => setIsPettingCat(false), 2400);
    } else if (nearbyHotspot.id === 'store_hotspot') {
      const gift = flags.giftChoice;
      if (gift === 'sweets') targetDialogueId = 'ch4_store_sweets';
      else if (gift === 'teddy') targetDialogueId = 'ch4_store_teddy';
      else if (gift === 'art_set') targetDialogueId = 'ch4_store_art';
      else targetDialogueId = 'ch4_store_sweets';
    } else if (nearbyHotspot.id === 'rebecca_give_gift') {
      const gift = flags.giftChoice;
      if (gift === 'sweets') targetDialogueId = 'ch5_give_gift_sweets';
      else if (gift === 'teddy') targetDialogueId = 'ch5_give_gift_teddy';
      else if (gift === 'art_set') targetDialogueId = 'ch5_give_gift_art';
      else targetDialogueId = 'ch5_give_gift_sweets';
    }

    // Оновлення специфічних прапорців
    const newFlags = { ...flags };
    if (nearbyHotspot.id === 'susie_bed') newFlags.spokenToSusie = true;
    if (nearbyHotspot.id === 'rebecca_table') newFlags.spokenToRebecca = true;
    if (nearbyHotspot.id === 'door_lantern') newFlags.hasLantern = true;
    if (nearbyHotspot.id === 'pharmacy_hotspot') newFlags.pharmacyBought = true;
    if (nearbyHotspot.id === 'store_hotspot') newFlags.storeBought = true;

    setFlags(newFlags);
    flagsRef.current = newFlags;

    const node = DIALOGUES[targetDialogueId];
    if (node) {
      triggerDialogueEffects(node);
      setActiveDialogue(node);
    }
  }, [activeDialogue, nearbyHotspot, flags, anxiety, triggerDialogueEffects]);

  // Обробка клавіатури
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'PLAYING') return;

      if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
        keysRef.current.left = true;
      } else if (e.code === 'KeyD' || e.code === 'ArrowRight') {
        keysRef.current.right = true;
      } else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        keysRef.current.shift = true;
      } else if (e.code === 'KeyE') {
        triggerHotspotInteraction();
      } else if (e.code === 'Escape') {
        setGameState('PAUSED');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
        keysRef.current.left = false;
      } else if (e.code === 'KeyD' || e.code === 'ArrowRight') {
        keysRef.current.right = false;
      } else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        keysRef.current.shift = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, triggerHotspotInteraction]);

  // Головний ігровий цикл (requestAnimationFrame)
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    let isRunning = true;
    lastFrameTimeRef.current = performance.now();

    const loop = (time: number) => {
      if (!isRunning) return;

      const dt = Math.min((time - lastFrameTimeRef.current) / 1000, 0.1);
      lastFrameTimeRef.current = time;

      const chMeta = CHAPTERS_DATA[chapterRef.current];
      const isInputLocked = !!activeDialogueRef.current || isPlayerDown;

      // Обчислення руху
      const moveLeft = !isInputLocked && (keysRef.current.left || touchMoveRef.current.left);
      const moveRight = !isInputLocked && (keysRef.current.right || touchMoveRef.current.right);
      const isSprint = keysRef.current.shift;

      let currentX = playerXRef.current;
      let moving = false;
      const speed = isSprint ? 270 : 190; // пікселів за секунду (біг / хода)

      if (moveLeft) {
        currentX = Math.max(60, currentX - speed * dt);
        playerFacingRef.current = 'left';
        moving = true;
      } else if (moveRight) {
        currentX = Math.min(chMeta.worldWidth - 60, currentX + speed * dt);
        playerFacingRef.current = 'right';
        moving = true;
      }

      playerXRef.current = currentX;
      isMovingRef.current = moving;

      setPlayerX(currentX);
      setPlayerFacing(playerFacingRef.current);
      setIsMoving(moving);

      // Відтворення звуку кроків
      if (moving && time - lastFootstepTimeRef.current > 360) {
        lastFootstepTimeRef.current = time;
        let surface: 'dirt' | 'wood' | 'puddle' = 'dirt';
        if (chMeta.environment === 'home' || chMeta.environment === 'home_night') {
          surface = 'wood';
        } else if (Math.abs(currentX - 350) < 60 || Math.abs(currentX - 750) < 60 || Math.abs(currentX - 1150) < 60) {
          surface = 'puddle';
        }
        soundEngine.playFootstep(surface);
      }

      // Автоматичний початок розмови з містером Джиммі у 3 розділі (без потреби тиснути E)
      if (
        chapterRef.current === 3 &&
        currentX >= 880 &&
        !flagsRef.current.jimmyChoice &&
        !activeDialogueRef.current
      ) {
        const meetJimmyNode = DIALOGUES['ch3_meet_jimmy'];
        if (meetJimmyNode) {
          triggerDialogueEffects(meetJimmyNode);
          setActiveDialogue(meetJimmyNode);
        }
      }

      // Перевірка найближчої інтерактивної точки
      const hotspots = HOTSPOTS_BY_CHAPTER[chapterRef.current] || [];
      const currentFlags = flagsRef.current;
      let matchedSpot: Hotspot | null = null;

      for (const spot of hotspots) {
        if (spot.condition && !spot.condition(currentFlags)) continue;
        const dist = Math.abs(currentX - spot.x);
        if (dist <= spot.width * 0.7) {
          matchedSpot = spot;
          break;
        }
      }
      setNearbyHotspot(matchedSpot);

      // Рендеринг сцени через Canvas
      if (rendererRef.current) {
        // У 2 розділі вдома ліхтар з'являється ТІЛЬКИ після взяття біля дверей!
        const hasLanternNow = chapterRef.current === 2
          ? !!currentFlags.hasLantern
          : (chapterRef.current === 7 ? false : (currentFlags.hasLantern ?? true));

        const renderState: RenderState = {
          playerX: currentX,
          playerFacing: playerFacingRef.current,
          isMoving: moving,
          chapter: chapterRef.current,
          environment: chMeta.environment,
          worldWidth: chMeta.worldWidth,
          anxiety: anxietyRef.current,
          nearbyHotspot: matchedSpot,
          hasLantern: hasLanternNow,
          redFlashAmount,
          glitchAmount,
          shakeAmount,
          isNightmareVision: chapterRef.current === 4 && currentX > 1700,
          isPettingCat,
          isPlayerDown
        };

        rendererRef.current.render(renderState, dt);
      }

      animationFrameIdRef.current = requestAnimationFrame(loop);
    };

    animationFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      isRunning = false;
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [gameState, redFlashAmount, glitchAmount, shakeAmount, isPettingCat, isPlayerDown]);

  const meta = CHAPTERS_DATA[currentChapter];

  return (
    <main className="relative w-screen h-screen bg-black overflow-hidden select-none">
      
      {/* Головне меню */}
      {gameState === 'MENU' && (
        <MainMenu
          onStartNewGame={startNewGame}
          onContinueGame={continueGame}
          saveData={saveData}
        />
      )}

      {/* Титр розділу */}
      {gameState === 'CHAPTER_CARD' && (
        <ChapterCard
          meta={meta}
          onFinished={() => setGameState('PLAYING')}
        />
      )}

      {/* Головне ігрове поле Canvas */}
      {(gameState === 'PLAYING' || gameState === 'PAUSED') && (
        <>
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full block cursor-default"
          />

          {/* Верхній HUD */}
          <div className="absolute top-4 inset-x-4 z-20 flex items-center justify-between pointer-events-none">
            
            {/* Назва розділу */}
            <div className="flex items-center gap-3 bg-slate-950/70 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-800/80 shadow-lg pointer-events-auto">
              <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400">
                {meta.title}
              </span>
              <span className="text-slate-600 text-xs">/</span>
              <span className="text-xs font-semibold tracking-wide text-slate-200">
                {meta.subtitle}
              </span>
            </div>

            {/* Інвентар та кнопка паузи */}
            <div className="flex items-center gap-2 pointer-events-auto">
              {inventory.length > 0 && (
                <div className="hidden sm:flex items-center gap-1.5 bg-slate-950/70 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-800/80 text-xs text-amber-300">
                  <span className="text-slate-400">Інвентар:</span>
                  <span className="font-medium">{inventory.join(', ')}</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  soundEngine.playSelectSound();
                  setGameState('PAUSED');
                }}
                className="w-9 h-9 rounded-full bg-slate-950/80 hover:bg-slate-800 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer shadow-lg"
                title="Пауза"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              </button>
            </div>
          </div>

          {/* Діалогове вікно */}
          {activeDialogue && (
            <DialogueBox
              node={activeDialogue}
              onAdvance={handleAdvanceDialogue}
              onSelectChoice={handleSelectChoice}
            />
          )}

          {/* Віртуальні наекранні кнопки для мобільних */}
          <TouchControls
            onMoveLeftStart={() => { touchMoveRef.current.left = true; }}
            onMoveLeftEnd={() => { touchMoveRef.current.left = false; }}
            onMoveRightStart={() => { touchMoveRef.current.right = true; }}
            onMoveRightEnd={() => { touchMoveRef.current.right = false; }}
            onActionClick={triggerHotspotInteraction}
            isNearHotspot={!!nearbyHotspot}
          />
        </>
      )}

      {/* Меню паузи */}
      {gameState === 'PAUSED' && (
        <PauseMenu
          onResume={() => setGameState('PLAYING')}
          onRestartChapter={() => setupChapter(currentChapter)}
          onExitToMenu={() => {
            saveCurrentProgress(currentChapter, anxiety, flags, inventory, playerX);
            soundEngine.stopAll();
            setGameState('MENU');
          }}
        />
      )}

      {/* Фінальні титри */}
      {gameState === 'CREDITS' && (
        <CreditsView
          onPlayAgain={startNewGame}
        />
      )}

    </main>
  );
}
