import { ChapterNumber, DialogueNode, EnvironmentType, Hotspot } from '../types/game';

export interface ChapterMeta {
  number: ChapterNumber;
  title: string;
  subtitle: string;
  environment: EnvironmentType;
  playerStartX: number;
  worldWidth: number;
  initialDialogueId?: string;
  ambientAnxiety: number;
}

export const CHAPTERS_DATA: Record<ChapterNumber, ChapterMeta> = {
  1: {
    number: 1,
    title: 'Розділ 1',
    subtitle: 'Сон',
    environment: 'graveyard',
    playerStartX: 180,
    worldWidth: 1600,
    initialDialogueId: 'ch1_intro',
    ambientAnxiety: 20
  },
  2: {
    number: 2,
    title: 'Розділ 2',
    subtitle: 'Вечір удома',
    environment: 'home',
    playerStartX: 220,
    worldWidth: 1200,
    initialDialogueId: 'ch2_intro',
    ambientAnxiety: 10
  },
  3: {
    number: 3,
    title: 'Розділ 3',
    subtitle: 'Лісова дорога',
    environment: 'forest_road',
    playerStartX: 150,
    worldWidth: 2000,
    initialDialogueId: 'ch3_start',
    ambientAnxiety: 25
  },
  4: {
    number: 4,
    title: 'Розділ 4',
    subtitle: 'Місто',
    environment: 'town',
    playerStartX: 160,
    worldWidth: 2200,
    initialDialogueId: 'ch4_intro',
    ambientAnxiety: 35
  },
  5: {
    number: 5,
    title: 'Розділ 5',
    subtitle: 'Ліки',
    environment: 'home_night',
    playerStartX: 150,
    worldWidth: 1200,
    initialDialogueId: 'ch5_intro',
    ambientAnxiety: 25
  },
  6: {
    number: 6,
    title: 'Розділ 6',
    subtitle: 'Місце зі сну',
    environment: 'forest_grave',
    playerStartX: 150,
    worldWidth: 1900,
    initialDialogueId: 'ch6_intro',
    ambientAnxiety: 60
  },
  7: {
    number: 7,
    title: 'Розділ 7',
    subtitle: 'Пробудження',
    environment: 'home',
    playerStartX: 200,
    worldWidth: 1200,
    initialDialogueId: 'ch7_intro',
    ambientAnxiety: 80
  }
};

export const DIALOGUES: Record<string, DialogueNode> = {
  // =================== РОЗДІЛ 1: СОН ===================
  ch1_intro: {
    id: 'ch1_intro',
    speaker: 'bob',
    text: 'Де я?.. Темрява... Старі надгробки... Земля під ногами волога й холодна.',
    nextDialogueId: 'ch1_intro_2'
  },
  ch1_intro_2: {
    id: 'ch1_intro_2',
    speaker: 'endro',
    text: '...Бобе... Бобе...',
    triggerEffect: 'whisper',
    soundCue: 'whisper'
  },
  ch1_inspect_shadow: {
    id: 'ch1_inspect_shadow',
    speaker: 'bob',
    text: 'Тату?.. Це ти стоїш біля огорожі?! Тату, стривай!',
    nextDialogueId: 'ch1_shadow_talk'
  },
  ch1_shadow_talk: {
    id: 'ch1_shadow_talk',
    speaker: 'endro',
    text: 'Він... там... під корінням... лопата... Не дивись у землю, синку...',
    triggerEffect: 'glitch',
    nextDialogueId: 'ch1_shadow_scream'
  },
  ch1_shadow_scream: {
    id: 'ch1_shadow_scream',
    speaker: 'system',
    text: 'Темний силует різко падає вперед, простягаючи пальці до твого горла!',
    triggerEffect: 'stinger',
    anxietyDelta: 10,
    endChapterOnComplete: true
  },

  // =================== РОЗДІЛ 2: ВЕЧІР УДОМА ===================
  ch2_intro: {
    id: 'ch2_intro',
    speaker: 'bob',
    text: '[Важко дихає] Знову цей кошмар... Цвинтар, лопата, шепіт батька... Голова розколюється. Треба перевірити маму.',
    nextDialogueId: undefined
  },
  ch2_talk_susie: {
    id: 'ch2_talk_susie',
    speaker: 'susie',
    text: 'Бобе, любий... Ти вже прокинувся? Мені все важче дихати, кашель не відпускає... Пляшечка з мікстурою зовсім спорожніла.',
    nextDialogueId: 'ch2_talk_susie_2'
  },
  ch2_talk_susie_2: {
    id: 'ch2_talk_susie_2',
    speaker: 'bob',
    text: 'Я сходжу в місто до чергової аптеки, мамо. Не хвилюйся, я все дістану.',
    nextDialogueId: 'ch2_talk_susie_3'
  },
  ch2_talk_susie_3: {
    id: 'ch2_talk_susie_3',
    speaker: 'susie',
    text: 'Будь обережний у лісі, сину... Вже четвертий день, як Ендро пішов на роботу до цвинтаря і не повернувся. Ніхто в місті не бачив його... Де ж він може бути?..',
    nextDialogueId: 'ch2_talk_susie_4'
  },
  ch2_talk_susie_4: {
    id: 'ch2_talk_susie_4',
    speaker: 'bob',
    text: 'Ми знайдемо його, мамо. Обіцяю. А зараз я принесу тобі ліки. Піду ще загляну до Ребеки перед виходом.'
  },
  ch2_talk_rebecca: {
    id: 'ch2_talk_rebecca',
    speaker: 'rebecca',
    text: 'Бобе... Ти знову йдеш? Надворі так темно і гримить. Мені страшно без тата...',
    nextDialogueId: 'ch2_rebecca_choice'
  },
  ch2_rebecca_choice: {
    id: 'ch2_rebecca_choice',
    speaker: 'bob',
    text: 'Не бійся, маленька. Я швидко повернуся з міста. Що тобі принести, аби ти посміхнулася?',
    choices: [
      {
        text: '«Я куплю твої улюблені м\'ятні цукерки.»',
        nextDialogueId: 'ch2_rebecca_sweets',
        flagKey: 'giftChoice',
        flagValue: 'sweets'
      },
      {
        text: '«Я знайду в крамниці м\'якого плюшевого ведмедика.»',
        nextDialogueId: 'ch2_rebecca_teddy',
        flagKey: 'giftChoice',
        flagValue: 'teddy'
      },
      {
        text: '«Я візьму гарний набір кольорових олівців для малювання.»',
        nextDialogueId: 'ch2_rebecca_art',
        flagKey: 'giftChoice',
        flagValue: 'art_set'
      }
    ]
  },
  ch2_rebecca_sweets: {
    id: 'ch2_rebecca_sweets',
    speaker: 'rebecca',
    text: 'Цукерки! Дякую, Бобе! Тільки повертайся швидше, добре?',
    nextDialogueId: 'ch2_rebecca_done'
  },
  ch2_rebecca_teddy: {
    id: 'ch2_rebecca_teddy',
    speaker: 'rebecca',
    text: 'Справжнього ведмедика? Я спатиму з ним в обіймах і мені не снитимуться жахи!',
    nextDialogueId: 'ch2_rebecca_done'
  },
  ch2_rebecca_art: {
    id: 'ch2_rebecca_art',
    speaker: 'rebecca',
    text: 'Олівці! Я намалюю сонце, наш сад і тата біля ґанку!',
    nextDialogueId: 'ch2_rebecca_done'
  },
  ch2_rebecca_done: {
    id: 'ch2_rebecca_done',
    speaker: 'bob',
    text: 'Домовилися. Біля дверей стоїть мій ліхтар — треба взяти його, бо в лісі нічого не видно.'
  },
  ch2_take_lantern: {
    id: 'ch2_take_lantern',
    speaker: 'bob',
    text: 'Гасовий ліхтар. Скло брудне, але гніт горить справно. Тепер можна вирушати в дорогу крізь дощ.',
    inventoryAdd: 'Гасовий ліхтар',
    nextDialogueId: 'ch2_leave_house'
  },
  ch2_leave_house: {
    id: 'ch2_leave_house',
    speaker: 'system',
    text: 'Боб застібає комір пальта, піднімає ліхтар і виходить у мокру холодну темряву.',
    endChapterOnComplete: true
  },

  // =================== РОЗДІЛ 3: ЛІСОВА ДОРОГА ===================
  ch3_start: {
    id: 'ch3_start',
    speaker: 'bob',
    text: 'Дорога розмокла від дощу. Ліс гуде під поривами вітру. До міста ще зо два кілометри...'
  },
  ch3_meet_jimmy: {
    id: 'ch3_meet_jimmy',
    speaker: 'jimmy',
    text: 'Ого, кого це занесло на дорогу о такій порі? Боб? Юначе, що ти робиш у лісі в таку жахливу негоду?',
    nextDialogueId: 'ch3_jimmy_choice'
  },
  ch3_jimmy_choice: {
    id: 'ch3_jimmy_choice',
    speaker: 'bob',
    text: '[Джиммі дивиться на тебе з-під крисів мокрого капелюха. Його обличчя ховається в тіні.]',
    choices: [
      {
        text: '«Матері зле. Йду в міську аптеку по ліки та за подарунком для Ребеки.»',
        nextDialogueId: 'ch3_jimmy_honest',
        flagKey: 'jimmyChoice',
        flagValue: 'honest'
      },
      {
        text: '«Маю термінові справи в місті, містере Джиммі. Скоро повернуся.»',
        nextDialogueId: 'ch3_jimmy_evasive',
        flagKey: 'jimmyChoice',
        flagValue: 'evasive'
      },
      {
        text: '[Мовчки кивнути й спробувати обійти його стороною]',
        nextDialogueId: 'ch3_jimmy_silent',
        flagKey: 'jimmyChoice',
        flagValue: 'silent'
      }
    ]
  },
  ch3_jimmy_honest: {
    id: 'ch3_jimmy_honest',
    speaker: 'jimmy',
    text: 'Який турботливий син. Сюзі пощастило з тобою... Тільки не барися на дорозі. Вночі цей ліс буває небезпечним для тих, хто забагато роздивляється по кущах.',
    nextDialogueId: 'ch3_after_jimmy'
  },
  ch3_jimmy_evasive: {
    id: 'ch3_jimmy_evasive',
    speaker: 'jimmy',
    text: 'Справи? Які це в сімнадцятирічного хлопця можуть бути нічні справи?.. [Посміхається в темряві] Йди, Бобе. Але дивись під ноги, щоб не спіткнутися об щось зайве.',
    nextDialogueId: 'ch3_after_jimmy'
  },
  ch3_jimmy_silent: {
    id: 'ch3_jimmy_silent',
    speaker: 'jimmy',
    text: 'Чого це ти такий мовчазний, Бобе? Твій батько теж був надто впертим... Недобре ходити лісом з похмурим обличчям.',
    nextDialogueId: 'ch3_after_jimmy'
  },
  ch3_after_jimmy: {
    id: 'ch3_after_jimmy',
    speaker: 'bob',
    text: 'Дякую за пораду, містере Джиммі. Доброї ночі.',
    nextDialogueId: 'ch3_glitch_flash'
  },
  ch3_glitch_flash: {
    id: 'ch3_glitch_flash',
    speaker: 'system',
    text: 'Раптом у скронях Боба вибухає різкий спалах спогаду. Голос Джиммі... Він чув його уві сні!',
    triggerEffect: 'glitch',
    anxietyDelta: 15,
    soundCue: 'stinger',
    nextDialogueId: 'ch3_glitch_voice'
  },
  ch3_glitch_voice: {
    id: 'ch3_glitch_voice',
    speaker: 'endro',
    text: '...Лопата... це був він... Бобе, біжи...',
    triggerEffect: 'whisper',
    nextDialogueId: 'ch3_continue'
  },
  ch3_continue: {
    id: 'ch3_continue',
    speaker: 'bob',
    text: '[Хапається за серце] Що це було?! Батьків голос... Ні, це просто перевтома і мої власні страхи. Попереду вже видно вогні міста.'
  },
  ch3_reach_town: {
    id: 'ch3_reach_town',
    speaker: 'bob',
    text: 'Ось і перші міські ліхтарі. Швидше до аптеки.',
    endChapterOnComplete: true
  },

  // =================== РОЗДІЛ 4: МІСТО ===================
  ch4_intro: {
    id: 'ch4_intro',
    speaker: 'bob',
    text: 'Вулиці порожні, лише дощ б\'є по бруківці. Ось вивіска чергової аптеки, а поруч — невелика крамничка.'
  },
  ch4_pharmacy: {
    id: 'ch4_pharmacy',
    speaker: 'bob',
    text: 'Аптека ще відчинена. Я купую сироп від кашлю та знеболювальні для мами.',
    inventoryAdd: 'Ліки для матері',
    nextDialogueId: 'ch4_pharmacy_done'
  },
  ch4_pharmacy_done: {
    id: 'ch4_pharmacy_done',
    speaker: 'bob',
    text: 'Пляшечки з мікстурою надійно сховані в кишеню пальта. Мамі має стати краще. Тепер треба зайти за подарунком для Ребеки.'
  },
  ch4_store_sweets: {
    id: 'ch4_store_sweets',
    speaker: 'bob',
    text: 'Крамниця солодощів. Я купую велику коробку м\'ятних льодяників, які вона так любить.',
    inventoryAdd: 'М\'ятні цукерки',
    nextDialogueId: 'ch4_store_done'
  },
  ch4_store_teddy: {
    id: 'ch4_store_teddy',
    speaker: 'bob',
    text: 'У вітрині сувенірної лавки стоїть м\'який плюшевий ведмедик у коричневому светрі. Він ідеальний.',
    inventoryAdd: 'Плюшевий ведмедик',
    nextDialogueId: 'ch4_store_done'
  },
  ch4_store_art: {
    id: 'ch4_store_art',
    speaker: 'bob',
    text: 'У крамниці канцтоварів я обираю великий набір олівців з 24 кольорів та альбом для малювання.',
    inventoryAdd: 'Набір для малювання',
    nextDialogueId: 'ch4_store_done'
  },
  ch4_store_done: {
    id: 'ch4_store_done',
    speaker: 'bob',
    text: 'Все куплено. Пора вертатися додому тією самою лісовою дорогою.'
  },
  ch4_start_return: {
    id: 'ch4_start_return',
    speaker: 'bob',
    text: 'Знову ліс. Вітер став ще сильнішим. Що це за шум між дерев праворуч?..',
    nextDialogueId: 'ch4_vision_trigger'
  },
  ch4_vision_trigger: {
    id: 'ch4_vision_trigger',
    speaker: 'system',
    text: 'У гущавині дерев ти бачиш силует людини... Він знову і знову з розмаху встромляє лезо лопати у вологу землю!',
    triggerEffect: 'red_flash',
    anxietyDelta: 15,
    soundCue: 'stinger',
    nextDialogueId: 'ch4_vision_2'
  },
  ch4_vision_2: {
    id: 'ch4_vision_2',
    speaker: 'system',
    text: 'Силует у капелюсі раптово завмирає. Він повільно повертає голову в твій бік... Його очі світяться мертвотним холодом!',
    triggerEffect: 'glitch',
    anxietyDelta: 10,
    soundCue: 'stinger',
    nextDialogueId: 'ch4_vision_flee'
  },
  ch4_vision_flee: {
    id: 'ch4_vision_flee',
    speaker: 'bob',
    text: '[З перебитим подихом] БІЖАТИ! ШВИДШЕ ЗВІДСИ!',
    endChapterOnComplete: true
  },

  // =================== РОЗДІЛ 5: ЛІКИ ===================
  ch5_intro: {
    id: 'ch5_intro',
    speaker: 'bob',
    text: '[Зачиняє двері на засув і притискається спиною] Я вдома... Світло лампи... Боже, серце вискакує з грудей. Що це було там, у лісі?!'
  },
  ch5_give_medicine: {
    id: 'ch5_give_medicine',
    speaker: 'bob',
    text: 'Мамо, я приніс ліки. Ось, випий мікстуру.',
    inventoryRemove: 'Ліки для матері',
    nextDialogueId: 'ch5_susie_react'
  },
  ch5_susie_react: {
    id: 'ch5_susie_react',
    speaker: 'susie',
    text: '[Робить кілька ковтків] Ох... Спасибі, Бобе. В грудях нарешті розлилося тепло. Ти мій рятівник... Але чому ти весь тремтиш? Щось трапилося дорогою?',
    nextDialogueId: 'ch5_susie_react_2'
  },
  ch5_susie_react_2: {
    id: 'ch5_susie_react_2',
    speaker: 'bob',
    text: 'Ні, мамо, все добре. Просто злива і холодний вітер. Відпочивай. Я піду до Ребеки.',
    nextDialogueId: undefined
  },
  ch5_give_gift_sweets: {
    id: 'ch5_give_gift_sweets',
    speaker: 'bob',
    text: 'Ребеко, тримай твої улюблені м\'ятні льодяники!',
    inventoryRemove: 'М\'ятні цукерки',
    nextDialogueId: 'ch5_rebecca_sweets_react'
  },
  ch5_rebecca_sweets_react: {
    id: 'ch5_rebecca_sweets_react',
    speaker: 'rebecca',
    text: 'Ура-а-а! Справжні м\'ятні льодяники! Ти найкращий брат у світі! Я візьму одну цукерку зараз, а решту збережу для мами й тата!',
    nextDialogueId: 'ch5_bed_prompt'
  },
  ch5_give_gift_teddy: {
    id: 'ch5_give_gift_teddy',
    speaker: 'bob',
    text: 'Дивись, кого я зустрів у місті. Він шукав собі нову затишну кімнату.',
    inventoryRemove: 'Плюшевий ведмедик',
    nextDialogueId: 'ch5_rebecca_teddy_react'
  },
  ch5_rebecca_teddy_react: {
    id: 'ch5_rebecca_teddy_react',
    speaker: 'rebecca',
    text: 'Який він м\'якенький! Я назву його Бадді! Він охоронятиме мої сни від кошмарів, поки тато не повернеться!',
    nextDialogueId: 'ch5_bed_prompt'
  },
  ch5_give_gift_art: {
    id: 'ch5_give_gift_art',
    speaker: 'bob',
    text: 'Ребеко, ось твій альбом та повний набір кольорових олівців!',
    inventoryRemove: 'Набір для малювання',
    nextDialogueId: 'ch5_rebecca_art_react'
  },
  ch5_rebecca_art_react: {
    id: 'ch5_rebecca_art_react',
    speaker: 'rebecca',
    text: 'Скільки кольорів! Я намалюю наш будинок, маму, тебе з ліхтарем... і тата, коли він повернеться додому!',
    nextDialogueId: 'ch5_bed_prompt'
  },
  ch5_bed_prompt: {
    id: 'ch5_bed_prompt',
    speaker: 'bob',
    text: 'Вдома тепло і безпечно. Але в моїй голові стоїть той самий силует з лопатою... Мені потрібно лягти поспати.'
  },
  ch5_sleep: {
    id: 'ch5_sleep',
    speaker: 'system',
    text: 'Боб лягає в ліжко, але кожна тінь у кімнаті здається йому чужим силуетом. Тривога не відпускає.',
    endChapterOnComplete: true
  },

  // =================== РОЗДІЛ 6: МІСЦЕ ЗІ СНУ ===================
  ch6_intro: {
    id: 'ch6_intro',
    speaker: 'bob',
    text: 'Наступний полудень. Небо затягнуте важкими свинцевими хмарами. Я не можу сидіти вдома. Той сон і видіння... Вони не дають мені спокою. Я мушу знайти те місце в хащах.'
  },
  ch6_find_grave: {
    id: 'ch6_find_grave',
    speaker: 'bob',
    text: 'Ось воно... Стара просіка біля яру. Земля свіжо скопана, калюжі наповнені чорною багнюкою. І лопата... Вона стирчить просто з землі.',
    nextDialogueId: 'ch6_investigate_choice'
  },
  ch6_investigate_choice: {
    id: 'ch6_investigate_choice',
    speaker: 'bob',
    text: 'Моє серце шалено калатає. Що мені робити?!',
    choices: [
      {
        text: '«Оглянути лопату біля ями»',
        nextDialogueId: 'ch6_choice_shovel',
        flagKey: 'graveChoice',
        flagValue: 'shovel',
        anxietyDelta: 15
      },
      {
        text: '«Зазирнути вглиб свіжої ями»',
        nextDialogueId: 'ch6_choice_grave',
        flagKey: 'graveChoice',
        flagValue: 'grave',
        anxietyDelta: 20
      },
      {
        text: '«Бігти звідси геть, поки не пізно!»',
        nextDialogueId: 'ch6_choice_leave',
        flagKey: 'graveChoice',
        flagValue: 'leave',
        anxietyDelta: 10
      }
    ]
  },
  ch6_choice_shovel: {
    id: 'ch6_choice_shovel',
    speaker: 'bob',
    text: 'На держаку лопати вибиті знайомі ініціали... «Е. Б.» — Ендро Блейк! Це батькова лопата з цвинтаря! Але руків\'я вкрите бурими сухими плямами...',
    nextDialogueId: 'ch6_climax_strike'
  },
  ch6_choice_grave: {
    id: 'ch6_choice_grave',
    speaker: 'bob',
    text: 'Я підходжу до краю і заглядаю в чорноту... З-під шару глини визирає знайомий срібний кишеньковий годинник батька... Боже мій...',
    nextDialogueId: 'ch6_climax_strike'
  },
  ch6_choice_leave: {
    id: 'ch6_choice_leave',
    speaker: 'bob',
    text: 'Ні, ні, це божевілля! Треба негайно покликати шерифа! Я розвертаюся, щоб бігти...',
    nextDialogueId: 'ch6_climax_strike'
  },
  ch6_climax_strike: {
    id: 'ch6_climax_strike',
    speaker: 'system',
    text: 'ХРУСК ГІЛКИ ПОЗАДУ. ГЛУХИЙ СТРАШНИЙ УДАР У ПОТИЛИЦЮ!',
    triggerEffect: 'heavy_hit',
    soundCue: 'heavy_hit',
    nextDialogueId: 'ch6_jimmy_appear'
  },
  ch6_jimmy_appear: {
    id: 'ch6_jimmy_appear',
    speaker: 'jimmy',
    text: 'Тобі тут не місце, хлопче. Ти забагато бачив.',
    triggerEffect: 'red_flash',
    nextDialogueId: 'ch6_blackout'
  },
  ch6_blackout: {
    id: 'ch6_blackout',
    speaker: 'system',
    text: 'Перед очима розтікається густа чорна пляма. Звуки лісу згасають.',
    endChapterOnComplete: true
  },

  // =================== РОЗДІЛ 7: ПРОБУДЖЕННЯ ===================
  ch7_intro: {
    id: 'ch7_intro',
    speaker: 'bob',
    text: '[Розплющує очі] Моє ліжко?.. Кімната... Голова ніби розколота навпіл. Невже це все був лише страшний сон?! Мені треба до мами.'
  },
  ch7_talk_susie_final: {
    id: 'ch7_talk_susie_final',
    speaker: 'susie',
    text: 'Бобе! Слава Богу, ти прийшов до тями! Ти так марив уві сні, метався по ліжку...',
    nextDialogueId: 'ch7_susie_final_2'
  },
  ch7_susie_final_2: {
    id: 'ch7_susie_final_2',
    speaker: 'bob',
    text: 'Мамо... Тато... Я бачив лопату в лісі...',
    nextDialogueId: 'ch7_susie_final_3'
  },
  ch7_susie_final_3: {
    id: 'ch7_susie_final_3',
    speaker: 'susie',
    text: 'Ох, синку... Поки ти спав, сюди заходив наш сусід, добрий містер Джиммі. Він приніс жахливу звістку... Він сказав, що шукав Ендро біля греблі... і знайшов його пальто у воді. Джиммі каже, що твій батько втопився...',
    nextDialogueId: 'ch7_truth_reveal'
  },
  ch7_truth_reveal: {
    id: 'ch7_truth_reveal',
    speaker: 'bob',
    text: '[Кров холоне в жилах] Пальто?.. Ні... Джиммі не знаходив пальто. Джиммі сам убив його в яру! Вбивця щойно стояв у нашій вітальні, поки я спав без тями!',
    triggerEffect: 'glitch',
    anxietyDelta: 30,
    soundCue: 'stinger',
    nextDialogueId: 'ch7_bob_resolve'
  },
  ch7_bob_resolve: {
    id: 'ch7_bob_resolve',
    speaker: 'bob',
    text: 'Мамо, Джиммі збрехав тобі! Я бачив свіжу яму в лісі та батькову лопату! Це Джиммі завдав мені удару по голові! Ми мусимо негайно підняти все місто та схопити його, поки він не втік і не дістався до нас знову!',
    nextDialogueId: 'ch7_whisper_final'
  },
  ch7_whisper_final: {
    id: 'ch7_whisper_final',
    speaker: 'endro',
    text: '...Дякую, синку... Ти викрив душогуба. Не дивись у землю... Дивись уперед і бережи родину... Я завжди поруч...',
    triggerEffect: 'whisper',
    soundCue: 'whisper',
    nextDialogueId: 'ch7_end_cutscene'
  },
  ch7_end_cutscene: {
    id: 'ch7_end_cutscene',
    speaker: 'system',
    text: 'За вікном невпинно шелестить дощ. Боб стискає кулаки з рішучістю в очах: він не дозволить убивці уникнути розплати.',
    endChapterOnComplete: true
  },

  // =================== ДОСЛІДЖЕННЯ ДЕТАЛЕЙ СВІТУ (ЛОР ТА ОГЛЯД) ===================
  ch1_gate_inspect: {
    id: 'ch1_gate_inspect',
    speaker: 'bob',
    text: 'Стара іржава кована брама цвинтаря Сент-Джуд. Вона глухо порипує від вітру. Тут тато працював доглядачем останні десять років...'
  },
  ch1_mausoleum_inspect: {
    id: 'ch1_mausoleum_inspect',
    speaker: 'bob',
    text: 'Старовинний кам\'яний склеп роду Клівлендів. Важкі колони, мокрий мох... Повітря тут пахне сирою могильною землею.'
  },
  ch2_fish_painting_inspect: {
    id: 'ch2_fish_painting_inspect',
    speaker: 'bob',
    text: 'Картина та опудало великої струмкової форелі на дерев\'яній стіні. Тато зловив її у Чорному струмку і так пишався нею. Він любив повторювати: «Річка все бачить і завжди повертає правду на поверхню».'
  },
  ch2_fireplace_inspect: {
    id: 'ch2_fireplace_inspect',
    speaker: 'bob',
    text: 'На каміні стоїть наше сімейне фото: тато радісно тримає маленьку Ребеку на руках, а мама усміхається... Коли ми востаннє збиралися всі разом?..'
  },
  ch2_clock_inspect: {
    id: 'ch2_clock_inspect',
    speaker: 'bob',
    text: 'Старий маятниковий годинник із дуба. Його мірне важке цокання — єдиний звук у хаті, крім маминого надсадного кашлю.'
  },
  ch3_sign_inspect: {
    id: 'ch3_sign_inspect',
    speaker: 'bob',
    text: 'Похилений дерев\'яний дороговказ: «До міста — 2 милі». Ліс довкола стає все густішим і темнішим.'
  },
  ch3_bridge_inspect: {
    id: 'ch3_bridge_inspect',
    speaker: 'bob',
    text: 'Дерев\'яний міст над Чорним струмком. Вода вирує внизу, чорна мов нафта, пінячись об слизьке каміння.'
  },
  ch4_poster_inspect: {
    id: 'ch4_poster_inspect',
    speaker: 'endro_alive',
    text: '«УВАГА! РОЗШУКУЄТЬСЯ ЕНДРО БЛЕЙК, 42 РОКИ. Доглядач цвинтаря Сент-Джуд...» На розмоклій листівці тато дивиться своїм теплим живим поглядом у знайомій картатій сорочці. Я зроблю все, щоб покарати того, хто забрав тебе у нас.'
  },
  ch4_cat_pet: {
    id: 'ch4_cat_pet',
    speaker: 'cat',
    text: 'Мур-р-р-р... [Вуличний пухнастий кіт із блискучою рибиною в зубах ніжно треться об руку Боба й голосно муркоче. Від цього простого тепла на душі стає трохи спокійніше].',
    soundCue: 'cat_purr'
  },
  ch4_bakery_inspect: {
    id: 'ch4_bakery_inspect',
    speaker: 'bob',
    text: 'Міська пекарня братів Морріс. У запітнілій вітрині лежать свіжі буханці житнього хліба. У вікні горить тепла олійна лампа, але двері вже зачинені.'
  },
  ch4_clocktower_inspect: {
    id: 'ch4_clocktower_inspect',
    speaker: 'bob',
    text: 'Вежа міської ратуші. Важкий бронзовий дзвін глухо відбиває опівнічні години. Вологий вітер зриває краплі зі шпиля.'
  },
  ch6_lantern_inspect: {
    id: 'ch6_lantern_inspect',
    speaker: 'bob',
    text: 'Розбитий гасовий ліхтар... Скло тріснуло від сильного удару, а поруч у багнюці видно сліди волочіння важкого тіла...'
  }
};

export const HOTSPOTS_BY_CHAPTER: Record<ChapterNumber, Hotspot[]> = {
  1: [
    {
      id: 'cemetery_gate_spot',
      x: 320,
      width: 130,
      label: 'Іржава брама',
      hint: 'Оглянути браму цвинтаря',
      dialogueId: 'ch1_gate_inspect'
    },
    {
      id: 'mausoleum_spot',
      x: 750,
      width: 140,
      label: 'Кам\'яний склеп',
      hint: 'Зазирнути до склепу',
      dialogueId: 'ch1_mausoleum_inspect'
    },
    {
      id: 'grave_shadow',
      x: 1250,
      width: 140,
      label: 'Темний силует',
      hint: 'Підійти до тіні',
      dialogueId: 'ch1_inspect_shadow'
    }
  ],
  2: [
    {
      id: 'fish_painting_spot',
      x: 180,
      width: 100,
      label: 'Картина та опудало риби',
      hint: 'Оглянути батьківський трофей',
      dialogueId: 'ch2_fish_painting_inspect'
    },
    {
      id: 'susie_bed',
      x: 480,
      width: 120,
      label: 'Мати Сюзі',
      hint: 'Поговорити з матір\'ю',
      dialogueId: 'ch2_talk_susie'
    },
    {
      id: 'fireplace_spot',
      x: 640,
      width: 110,
      label: 'Камін та сімейне фото',
      hint: 'Поглянути на фотографію',
      dialogueId: 'ch2_fireplace_inspect'
    },
    {
      id: 'rebecca_table',
      x: 820,
      width: 100,
      label: 'Сестричка Ребека',
      hint: 'Запитати Ребеку',
      dialogueId: 'ch2_talk_rebecca',
      condition: (flags) => !!flags.spokenToSusie
    },
    {
      id: 'clock_spot',
      x: 950,
      width: 90,
      label: 'Старий годинник',
      hint: 'Послухати хід годинника',
      dialogueId: 'ch2_clock_inspect'
    },
    {
      id: 'door_lantern',
      x: 1120,
      width: 100,
      label: 'Гасовий ліхтар',
      hint: 'Взяти ліхтар і вийти',
      dialogueId: 'ch2_take_lantern',
      condition: (flags) => !!flags.spokenToRebecca
    }
  ],
  3: [
    {
      id: 'road_sign_spot',
      x: 380,
      width: 110,
      label: 'Дороговказ',
      hint: 'Прочитати напис',
      dialogueId: 'ch3_sign_inspect'
    },
    {
      id: 'jimmy_forest',
      x: 950,
      width: 130,
      label: 'Містер Джиммі',
      hint: 'Заговорити з незнайомцем',
      dialogueId: 'ch3_meet_jimmy'
    },
    {
      id: 'bridge_spot',
      x: 1350,
      width: 140,
      label: 'Дерев\'яний міст',
      hint: 'Подивитися на бурхливий струмок',
      dialogueId: 'ch3_bridge_inspect'
    },
    {
      id: 'road_to_town',
      x: 1850,
      width: 120,
      label: 'Дорога до міста',
      hint: 'Вийти до міських вогнів',
      dialogueId: 'ch3_reach_town',
      condition: (flags) => !!flags.jimmyChoice
    }
  ],
  4: [
    {
      id: 'pharmacy_hotspot',
      x: 600,
      width: 130,
      label: 'Аптека',
      hint: 'Купити ліки для матері',
      dialogueId: 'ch4_pharmacy',
      condition: (flags) => !flags.pharmacyBought
    },
    {
      id: 'cat_spot',
      x: 790,
      width: 100,
      label: 'Кіт із рибиною',
      hint: 'Погладити котика',
      dialogueId: 'ch4_cat_pet'
    },
    {
      id: 'missing_poster_spot',
      x: 960,
      width: 110,
      label: 'Оголошення про розшук',
      hint: 'Подивитися на фотографію батька',
      dialogueId: 'ch4_poster_inspect'
    },
    {
      id: 'bakery_spot',
      x: 1140,
      width: 110,
      label: 'Міська пекарня',
      hint: 'Зазирнути у вітрину',
      dialogueId: 'ch4_bakery_inspect'
    },
    {
      id: 'store_hotspot',
      x: 1350,
      width: 130,
      label: 'Крамниця подарунків',
      hint: 'Придбати подарунок для Ребеки',
      dialogueId: 'ch4_store_sweets',
      condition: (flags) => !flags.storeBought && !!flags.pharmacyBought
    },
    {
      id: 'clocktower_spot',
      x: 1580,
      width: 120,
      label: 'Вежа ратуші',
      hint: 'Поглянути на шпиль годинника',
      dialogueId: 'ch4_clocktower_inspect'
    },
    {
      id: 'return_path',
      x: 1950,
      width: 130,
      label: 'Стежка додому',
      hint: 'Повертатися через ліс',
      dialogueId: 'ch4_start_return',
      condition: (flags) => !!flags.pharmacyBought && !!flags.storeBought
    }
  ],
  5: [
    {
      id: 'susie_give_meds',
      x: 480,
      width: 120,
      label: 'Мати Сюзі',
      hint: 'Віддати ліки матері',
      dialogueId: 'ch5_give_medicine'
    },
    {
      id: 'fireplace_spot_ch5',
      x: 640,
      width: 110,
      label: 'Теплий камін',
      hint: 'Поглянути на вогонь',
      dialogueId: 'ch2_fireplace_inspect'
    },
    {
      id: 'rebecca_give_gift',
      x: 820,
      width: 100,
      label: 'Сестричка Ребека',
      hint: 'Вручити подарунок',
      dialogueId: 'ch5_give_gift_sweets',
      condition: (flags) => !flags.hasMedicine
    },
    {
      id: 'bob_bed',
      x: 1080,
      width: 120,
      label: 'Ліжко Боба',
      hint: 'Лягти спати',
      dialogueId: 'ch5_sleep',
      condition: (flags) => !flags.hasGift && !flags.hasMedicine
    }
  ],
  6: [
    {
      id: 'broken_lantern_spot',
      x: 750,
      width: 120,
      label: 'Розбитий ліхтар',
      hint: 'Оглянути сліди на землі',
      dialogueId: 'ch6_lantern_inspect'
    },
    {
      id: 'grave_site',
      x: 1150,
      width: 160,
      label: 'Свіжа могила та лопата',
      hint: 'Оглянути моторошне місце',
      dialogueId: 'ch6_find_grave'
    }
  ],
  7: [
    {
      id: 'susie_final_room',
      x: 650,
      width: 130,
      label: 'Мати Сюзі',
      hint: 'Підійти до матері',
      dialogueId: 'ch7_talk_susie_final'
    }
  ]
};
