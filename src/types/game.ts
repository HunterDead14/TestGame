export type GameState = 'MENU' | 'PLAYING' | 'CHAPTER_CARD' | 'PAUSED' | 'CREDITS';

export type ChapterNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type SpeakerId = 'bob' | 'susie' | 'rebecca' | 'jimmy' | 'endro' | 'endro_alive' | 'cat' | 'system';

export type EnvironmentType = 
  | 'graveyard' 
  | 'home' 
  | 'forest_road' 
  | 'town' 
  | 'home_night' 
  | 'forest_grave';

export interface DialogueChoice {
  text: string;
  nextDialogueId: string;
  flagKey?: string;
  flagValue?: string;
  anxietyDelta?: number;
  onSelectEffect?: 'glitch' | 'stinger' | 'heartbeat';
}

export interface DialogueNode {
  id: string;
  speaker: SpeakerId;
  text: string;
  choices?: DialogueChoice[];
  nextDialogueId?: string; // If no choices, auto next or next on click
  anxietyDelta?: number;
  triggerEffect?: 'glitch' | 'red_flash' | 'stinger' | 'whisper' | 'heavy_hit';
  inventoryAdd?: string;
  inventoryRemove?: string;
  soundCue?: string;
  endChapterOnComplete?: boolean;
}

export interface Hotspot {
  id: string;
  x: number;
  width: number;
  label: string;
  hint: string;
  dialogueId: string;
  requiresItem?: string;
  consumedOnce?: boolean;
  isTriggered?: boolean;
  condition?: (flags: GameFlags) => boolean;
}

export interface GameFlags {
  giftChoice?: 'sweets' | 'teddy' | 'art_set';
  jimmyChoice?: 'honest' | 'evasive' | 'silent';
  pharmacyBought?: boolean;
  storeBought?: boolean;
  graveChoice?: 'shovel' | 'grave' | 'leave';
  spokenToSusie?: boolean;
  spokenToRebecca?: boolean;
  hasLantern?: boolean;
  hasMedicine?: boolean;
  hasGift?: boolean;
  sawVision?: boolean;
}

export interface SaveData {
  chapter: ChapterNumber;
  anxiety: number;
  flags: GameFlags;
  inventory: string[];
  playerX: number;
  timestamp: number;
}
