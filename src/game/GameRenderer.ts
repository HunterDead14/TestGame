import { ChapterNumber, EnvironmentType, Hotspot } from '../types/game';

export interface RenderState {
  playerX: number;
  playerFacing: 'left' | 'right';
  isMoving: boolean;
  chapter: ChapterNumber;
  environment: EnvironmentType;
  worldWidth: number;
  anxiety: number;
  nearbyHotspot: Hotspot | null;
  hasLantern: boolean;
  redFlashAmount: number;
  glitchAmount: number;
  shakeAmount: number;
  isNightmareVision: boolean;
  isPettingCat?: boolean;
  isPlayerDown?: boolean;
}

interface RainDrop {
  x: number;
  y: number;
  speed: number;
  length: number;
  alpha: number;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
}

export class GameRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number = 800;
  private height: number = 600;
  private dpr: number = 1;

  private cameraX: number = 0;
  private walkAnimTime: number = 0;
  private rainDrops: RainDrop[] = [];
  private ripples: Ripple[] = [];
  private lightningTimer: number = 0;
  private lightningAlpha: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not get 2D context');
    this.ctx = context;

    this.initWeather();
    this.resize();
  }

  public resize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = this.canvas.getBoundingClientRect();
    this.width = rect.width || window.innerWidth;
    this.height = rect.height || window.innerHeight;

    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);

    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(this.dpr, this.dpr);
  }

  private initWeather() {
    this.rainDrops = [];
    for (let i = 0; i < 220; i++) {
      this.rainDrops.push({
        x: Math.random() * 2500,
        y: Math.random() * 1000,
        speed: 14 + Math.random() * 10,
        length: 16 + Math.random() * 18,
        alpha: 0.3 + Math.random() * 0.45
      });
    }
  }

  public render(state: RenderState, deltaTime: number) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const groundY = h * 0.72;

    // Плавна анімація ходьби
    if (state.isMoving && !state.isPettingCat && !state.isPlayerDown) {
      this.walkAnimTime += deltaTime * 8.5;
    } else {
      this.walkAnimTime = 0;
    }

    // Плавна камера
    const targetCamX = Math.max(0, Math.min(state.worldWidth - w, state.playerX - w * 0.45));
    this.cameraX += (targetCamX - this.cameraX) * 0.1;

    // Тремтіння камери: ТІЛЬКИ короткочасне під час самого удару/скримеру, без постійної фонової тряски
    let shakeX = 0;
    let shakeY = 0;
    if (state.shakeAmount > 0) {
      shakeX = (Math.random() - 0.5) * state.shakeAmount * 10;
      shakeY = (Math.random() - 0.5) * state.shakeAmount * 10;
    }

    // Блискавка
    this.lightningTimer += deltaTime;
    if (this.lightningTimer > 9 + Math.random() * 5 && state.environment !== 'home' && state.environment !== 'home_night') {
      this.lightningTimer = 0;
      this.lightningAlpha = 0.85;
    }
    if (this.lightningAlpha > 0) {
      this.lightningAlpha = Math.max(0, this.lightningAlpha - deltaTime * 3.5);
    }

    ctx.save();
    ctx.translate(shakeX, shakeY);

    // Базовий фон
    ctx.fillStyle = '#0a0e1c';
    ctx.fillRect(0, 0, w, h);

    // ================= ШАР 0: НЕБО ТА ХМАРИ =================
    this.renderSky(ctx, w, h, state.environment, this.cameraX);

    // ================= ШАР 1: ДАЛЕКИЙ ЛІС (ПАРАЛАКС 0.15) =================
    this.renderFarForest(ctx, w, groundY, this.cameraX * 0.15, state.environment);

    // ================= ШАР 2: СЕРЕДНІЙ ЛІС ТА ДЕКОРАЦІЇ (ПАРАЛАКС 0.45) =================
    this.renderMidForest(ctx, w, groundY, this.cameraX * 0.45, state.environment);

    // ================= ШАР 3: ОСНОВНИЙ СВІТ (ПАРАЛАКС 1.0) =================
    ctx.save();
    ctx.translate(-this.cameraX, 0);

    this.renderGround(ctx, state.worldWidth, groundY, h, state.environment);
    this.renderEnvironmentStructures(ctx, state, groundY);
    this.renderNPCs(ctx, state, groundY);

    ctx.restore();

    // ================= ДИНАМІЧНЕ ОСВІТЛЕННЯ СВІТУ (МАСКА ТЕМРЯВИ) =================
    this.renderLightingMask(ctx, w, h, state, groundY);

    // ================= РЕНДЕР ПЕРСОНАЖА ТА ПІДКАЗОК =================
    ctx.save();
    ctx.translate(-this.cameraX, 0);

    this.renderPlayer(ctx, state, groundY);

    if (state.nearbyHotspot) {
      this.renderHotspotIndicator(ctx, state.nearbyHotspot, groundY);
    }

    ctx.restore();

    // ================= ШАР 4: ПЕРЕДНІЙ ПЛАН (ПАРАЛАКС 1.35) =================
    this.renderForegroundVignetteBranches(ctx, w, h, this.cameraX * 1.35);

    // ================= ПОГОДА (ДОЩ, ТУМАН) =================
    if (state.environment !== 'home' && state.environment !== 'home_night') {
      this.renderWeather(ctx, w, h, groundY, deltaTime);
    }

    // ================= ХОРРОР-ЕФЕКТИ =================
    this.renderHorrorPostEffects(ctx, w, h, state);

    ctx.restore();
  }

  private renderSky(ctx: CanvasRenderingContext2D, w: number, h: number, env: EnvironmentType, camX: number) {
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.75);

    if (env === 'home' || env === 'home_night') {
      // Кімната будинку: теплі дерев'яні стіни
      skyGrad.addColorStop(0, '#1c1622');
      skyGrad.addColorStop(0.55, '#352319');
      skyGrad.addColorStop(1, '#4a2e1d');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // Стінові дерев'яні панелі
      ctx.strokeStyle = 'rgba(255, 230, 200, 0.06)';
      ctx.lineWidth = 1.5;
      for (let x = 0; x < w; x += 36) {
        ctx.beginPath();
        ctx.moveTo(x - (camX % 36), 0);
        ctx.lineTo(x - (camX % 36), h * 0.72);
        ctx.stroke();
      }
      return;
    }

    // Хмарне атмосферне нічне небо: димчасто-сині, свинцеві та індиго тони
    if (env === 'graveyard') {
      skyGrad.addColorStop(0, '#11192e');
      skyGrad.addColorStop(0.45, '#1e2945');
      skyGrad.addColorStop(1, '#2c3959');
    } else if (env === 'town') {
      skyGrad.addColorStop(0, '#141c33');
      skyGrad.addColorStop(0.5, '#232d4b');
      skyGrad.addColorStop(1, '#343e5c');
    } else {
      // Ліс / лісова дорога: похмуре свинцеве небо
      skyGrad.addColorStop(0, '#0d1527');
      skyGrad.addColorStop(0.5, '#19243f');
      skyGrad.addColorStop(1, '#253454');
    }

    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // Спалах блискавки
    if (this.lightningAlpha > 0) {
      ctx.fillStyle = `rgba(220, 238, 255, ${this.lightningAlpha})`;
      ctx.fillRect(0, 0, w, h);
    }

    // М'який холодний місяць за хмарами
    if (env !== 'town') {
      const moonX = w * 0.72 - (camX * 0.03);
      const moonY = h * 0.2;

      const moonGlow = ctx.createRadialGradient(moonX, moonY, 15, moonX, moonY, 160);
      moonGlow.addColorStop(0, 'rgba(215, 232, 255, 0.42)');
      moonGlow.addColorStop(0.4, 'rgba(160, 195, 245, 0.16)');
      moonGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = moonGlow;
      ctx.beginPath();
      ctx.arc(moonX, moonY, 160, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.arc(moonX, moonY, 26, 0, Math.PI * 2);
      ctx.fill();
    }

    // Об'ємні шари хмар, що пливуть над горизонтом
    const time = Date.now() * 0.0003;
    const cloudY = h * 0.28;

    // Шар 1: дальні темні хмари
    ctx.fillStyle = 'rgba(22, 32, 54, 0.65)';
    ctx.beginPath();
    ctx.moveTo(0, cloudY + 40);
    for (let cx = 0; cx <= w; cx += 50) {
      const cy = Math.sin(cx * 0.015 + time) * 18 + Math.cos(cx * 0.03 + time * 1.5) * 12;
      ctx.lineTo(cx, cloudY - 20 + cy);
    }
    ctx.lineTo(w, h * 0.72);
    ctx.lineTo(0, h * 0.72);
    ctx.closePath();
    ctx.fill();

    // Шар 2: середні хмарні клуби з підсвіткою
    ctx.fillStyle = 'rgba(32, 45, 74, 0.55)';
    ctx.beginPath();
    ctx.moveTo(0, cloudY + 70);
    for (let cx = 0; cx <= w; cx += 40) {
      const cy = Math.sin(cx * 0.02 - time * 1.2) * 22 + Math.cos(cx * 0.01 + time) * 14;
      ctx.lineTo(cx, cloudY + 15 + cy);
    }
    ctx.lineTo(w, h * 0.72);
    ctx.lineTo(0, h * 0.72);
    ctx.closePath();
    ctx.fill();
  }

  private renderFarForest(ctx: CanvasRenderingContext2D, w: number, groundY: number, offset: number, env: EnvironmentType) {
    if (env === 'home' || env === 'home_night') return;

    ctx.fillStyle = '#141d33';
    ctx.beginPath();
    ctx.moveTo(0, groundY);

    const step = 45;
    const startX = -(offset % step) - step;

    for (let x = startX; x < w + step * 2; x += step) {
      const hash = Math.sin((x + offset) * 0.05) * 45;
      ctx.lineTo(x, groundY - 150 + hash);
      ctx.lineTo(x + step * 0.5, groundY - 195 + hash);
    }
    ctx.lineTo(w, groundY);
    ctx.closePath();
    ctx.fill();
  }

  private renderMidForest(ctx: CanvasRenderingContext2D, w: number, groundY: number, offset: number, env: EnvironmentType) {
    if (env === 'home' || env === 'home_night') return;

    ctx.fillStyle = '#1e2b48';
    ctx.beginPath();
    ctx.moveTo(0, groundY);

    const step = 60;
    const startX = -(offset % step) - step;

    for (let x = startX; x < w + step * 2; x += step) {
      const h = Math.abs(Math.sin((x + offset) * 0.08)) * 80 + 120;
      ctx.lineTo(x, groundY - h * 0.4);
      ctx.lineTo(x + 12, groundY - h * 0.7);
      ctx.lineTo(x + 25, groundY - h);
      ctx.lineTo(x + 38, groundY - h * 0.7);
      ctx.lineTo(x + 50, groundY - h * 0.4);
      ctx.lineTo(x + step, groundY);
    }
    ctx.closePath();
    ctx.fill();
  }

  private renderGround(ctx: CanvasRenderingContext2D, worldWidth: number, groundY: number, totalHeight: number, env: EnvironmentType) {
    if (env === 'home' || env === 'home_night') {
      // Затишна дерев'яна підлога
      const floorGrad = ctx.createLinearGradient(0, groundY, 0, totalHeight);
      floorGrad.addColorStop(0, '#42281a');
      floorGrad.addColorStop(0.3, '#331d11');
      floorGrad.addColorStop(1, '#1e1008');
      ctx.fillStyle = floorGrad;
      ctx.fillRect(0, groundY, worldWidth, totalHeight - groundY);

      ctx.strokeStyle = '#23140b';
      ctx.lineWidth = 2;
      for (let y = groundY; y < totalHeight; y += 18) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(worldWidth, y);
        ctx.stroke();
      }
      return;
    }

    // Земля: вологий ґрунт з травою, що гарно видно
    const groundGrad = ctx.createLinearGradient(0, groundY, 0, totalHeight);
    groundGrad.addColorStop(0, '#23314f');
    groundGrad.addColorStop(0.15, '#172238');
    groundGrad.addColorStop(1, '#0c1322');

    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, groundY, worldWidth, totalHeight - groundY);

    // Трав'яний покрив
    ctx.fillStyle = '#2c3e66';
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    for (let x = 0; x < worldWidth; x += 12) {
      const yOff = Math.sin(x * 0.15) * 4;
      ctx.lineTo(x, groundY + yOff);
    }
    ctx.lineTo(worldWidth, groundY + 14);
    ctx.lineTo(0, groundY + 14);
    ctx.closePath();
    ctx.fill();

    // Калюжі з відблиском неба
    const puddleSpots = [350, 750, 1150, 1550];
    puddleSpots.forEach(px => {
      ctx.fillStyle = 'rgba(70, 105, 160, 0.55)';
      ctx.beginPath();
      ctx.ellipse(px, groundY + 8, 52, 11, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(180, 215, 255, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
  }

  private renderEnvironmentStructures(ctx: CanvasRenderingContext2D, state: RenderState, groundY: number) {
    const env = state.environment;

    if (env === 'home' || env === 'home_night') {
      // 0. Картина та дерев'яне опудало риби на стіні (x: 180)
      // Дерев'яна різьблена рама
      ctx.fillStyle = '#5c3a21';
      ctx.fillRect(145, groundY - 200, 70, 52);
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 3;
      ctx.strokeRect(145, groundY - 200, 70, 52);

      // Полотно з річковим пейзажем
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(151, groundY - 194, 58, 40);

      // Мальована форель у річці (сріблясто-смарагдова)
      ctx.fillStyle = '#059669';
      ctx.beginPath();
      ctx.ellipse(180, groundY - 174, 18, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      // Хвостовий плавець
      ctx.beginPath();
      ctx.moveTo(162, groundY - 174);
      ctx.lineTo(154, groundY - 181);
      ctx.lineTo(154, groundY - 167);
      ctx.closePath();
      ctx.fill();
      // Золотисте око та червоні цятки
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(192, groundY - 176, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(174, groundY - 175, 2.5, 2.5);
      ctx.fillRect(182, groundY - 173, 2.5, 2.5);

      // Дерев'яна плашка з трофейним опудалом під картиною
      ctx.fillStyle = '#78350f';
      ctx.fillRect(148, groundY - 138, 64, 20);
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(148, groundY - 138, 64, 20);
      // Срібляста річкова риба
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.ellipse(180, groundY - 128, 20, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(175, groundY - 122, 10, 3); // табличка

      // 1. Затишний цегляний камін (x: 640)
      ctx.fillStyle = '#451a03';
      ctx.fillRect(600, groundY - 140, 80, 140);
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(615, groundY - 80, 50, 80);

      // Полум'я та тліюче вугілля в каміні
      const flameFlicker = Math.sin(Date.now() * 0.012) * 5;
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(640, groundY - 30, 16 + flameFlicker, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(640, groundY - 32, 10 + flameFlicker * 0.5, 0, Math.PI * 2);
      ctx.fill();

      // Камінна полиця з сімейним фото та свічником
      ctx.fillStyle = '#78350f';
      ctx.fillRect(590, groundY - 145, 100, 10);

      // Рамка із сімейним фото
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(625, groundY - 170, 20, 25);
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 2;
      ctx.strokeRect(625, groundY - 170, 20, 25);
      ctx.fillStyle = '#1e293b'; // силует родини
      ctx.fillRect(629, groundY - 162, 12, 14);

      // Свічник
      ctx.fillStyle = '#d97706';
      ctx.fillRect(665, groundY - 162, 4, 17);
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(667, groundY - 165, 3, 0, Math.PI * 2);
      ctx.fill();

      // 2. Старовинний дубовий годинник із маятником (x: 950)
      ctx.fillStyle = '#3e2723';
      ctx.fillRect(935, groundY - 180, 32, 180);
      ctx.strokeStyle = '#5d4037';
      ctx.lineWidth = 2;
      ctx.strokeRect(935, groundY - 180, 32, 180);

      // Циферблат годинника
      ctx.fillStyle = '#fef3c7';
      ctx.beginPath();
      ctx.arc(951, groundY - 155, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Скляне віконце з рухомим маятником
      ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
      ctx.fillRect(942, groundY - 135, 18, 65);
      const pendulumAngle = Math.sin(Date.now() * 0.0035) * 8;
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(951, groundY - 135);
      ctx.lineTo(951 + pendulumAngle, groundY - 80);
      ctx.stroke();
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(951 + pendulumAngle, groundY - 80, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // 3. Велике вікно з краплями дощу (x: 320)
      ctx.fillStyle = '#1c2842';
      ctx.fillRect(290, groundY - 220, 110, 160);
      ctx.strokeStyle = '#543623';
      ctx.lineWidth = 5;
      ctx.strokeRect(290, groundY - 220, 110, 160);
      ctx.beginPath();
      ctx.moveTo(345, groundY - 220);
      ctx.lineTo(345, groundY - 60);
      ctx.moveTo(290, groundY - 140);
      ctx.lineTo(400, groundY - 140);
      ctx.stroke();

      // Шторки
      ctx.fillStyle = 'rgba(254, 243, 199, 0.15)';
      ctx.fillRect(292, groundY - 218, 20, 156);
      ctx.fillRect(378, groundY - 218, 20, 156);

      // 4. Тумбочка біля ліжка Сюзі з ліками (x: 410)
      ctx.fillStyle = '#3e2723';
      ctx.fillRect(400, groundY - 55, 30, 55);
      // Пляшечка з мікстурою
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(408, groundY - 70, 7, 15);
      // Чашка з чаєм
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(419, groundY - 65, 8, 10);

      // 5. Вхідні двері з вішалкою (x: 1120)
      ctx.fillStyle = '#2b1a10';
      ctx.fillRect(1100, groundY - 210, 85, 210);
      ctx.strokeStyle = '#543623';
      ctx.lineWidth = 4;
      ctx.strokeRect(1100, groundY - 210, 85, 210);
      // Дверна ручка
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(1110, groundY - 100, 4, 0, Math.PI * 2);
      ctx.fill();

      // Вішалка для одягу поруч з дверима
      ctx.fillStyle = '#42281a';
      ctx.fillRect(1135, groundY - 140, 6, 140);
      ctx.fillRect(1125, groundY - 130, 26, 4);

      // Якщо Боб ще не взяв ліхтар — він висить на гачку біля дверей!
      if (!state.hasLantern) {
        this.renderLanternProp(ctx, 1138, groundY - 80);
      }

    } else if (env === 'graveyard') {
      // 1. Кована брама цвинтаря (x: 320)
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(300, groundY);
      ctx.lineTo(300, groundY - 150);
      ctx.arc(325, groundY - 150, 25, Math.PI, 0);
      ctx.lineTo(350, groundY);
      ctx.stroke();
      ctx.fillRect(323, groundY - 190, 4, 20);
      ctx.fillRect(318, groundY - 182, 14, 4);

      // 2. Плакуча верба (x: 520)
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(510, groundY);
      ctx.lineTo(515, groundY - 160);
      ctx.lineTo(525, groundY - 160);
      ctx.lineTo(530, groundY);
      ctx.fill();
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      for (let g = 0; g < 8; g++) {
        ctx.beginPath();
        ctx.moveTo(520 + (g - 4) * 12, groundY - 150);
        ctx.quadraticCurveTo(515 + (g - 4) * 16, groundY - 80, 520 + (g - 4) * 18, groundY - 20);
        ctx.stroke();
      }

      // 3. Кам'яний склеп роду Клівлендів (x: 750)
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(710, groundY - 170, 90, 170);
      ctx.beginPath();
      ctx.moveTo(700, groundY - 170);
      ctx.lineTo(755, groundY - 215);
      ctx.lineTo(810, groundY - 170);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#090d16';
      ctx.fillRect(735, groundY - 120, 40, 120);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.strokeRect(735, groundY - 120, 40, 120);

      // 4. Ворон на надгробку (x: 950)
      const crowFlutter = Math.sin(Date.now() * 0.005) > 0.85 ? -4 : 0;
      ctx.fillStyle = '#020617';
      ctx.beginPath();
      ctx.ellipse(950, groundY - 95 + crowFlutter, 9, 6, -0.2, 0, Math.PI * 2);
      ctx.arc(957, groundY - 100 + crowFlutter, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(958, groundY - 101 + crowFlutter, 1.5, 1.5);

      // 5. Надгробки з мохом
      const tombstones = [420, 620, 950, 1180, 1420];
      tombstones.forEach((tx, idx) => {
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        if (idx % 2 === 0) {
          ctx.roundRect(tx - 16, groundY - 65, 32, 65, [8, 8, 0, 0]);
          ctx.fill();
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(tx, groundY - 45, 12, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          ctx.roundRect(tx - 18, groundY - 55, 36, 55, [6, 6, 0, 0]);
          ctx.fill();
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(tx - 24, groundY - 45, 48, 12);
        }
        ctx.fillStyle = '#14532d';
        ctx.fillRect(tx - 14, groundY - 10, 28, 10);
      });

    } else if (env === 'forest_road') {
      // 1. Дерев'яний дороговказ (x: 380)
      ctx.fillStyle = '#5c3a21';
      ctx.fillRect(375, groundY - 90, 8, 90);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(350, groundY - 95, 65, 18);
      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 9px monospace';
      ctx.fillText('← МІСТО', 355, groundY - 83);

      // 2. Покинутий зарослий віз (x: 680)
      ctx.fillStyle = '#3e2723';
      ctx.fillRect(650, groundY - 45, 70, 25);
      ctx.strokeStyle = '#5d4037';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(660, groundY - 20, 18, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(710, groundY - 20, 18, 0, Math.PI * 2);
      ctx.stroke();

      // 3. Дерев'яний міст над Чорним струмком (x: 1350)
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(1290, groundY - 10, 120, 60);
      const waterWave = Math.sin(Date.now() * 0.008) * 4;
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(1290, groundY + 15 + waterWave);
      ctx.lineTo(1410, groundY + 15 - waterWave);
      ctx.stroke();

      ctx.fillStyle = '#5c3a21';
      ctx.fillRect(1280, groundY - 8, 140, 12);
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(1280, groundY - 35);
      ctx.lineTo(1420, groundY - 35);
      ctx.stroke();
      [1290, 1340, 1390].forEach(bx => {
        ctx.fillRect(bx, groundY - 35, 6, 35);
      });

      // 4. Телефонні стовпи (x: 850, 1650)
      [850, 1650].forEach(px => {
        ctx.fillStyle = '#42281a';
        ctx.fillRect(px - 4, groundY - 180, 8, 180);
        ctx.fillRect(px - 16, groundY - 170, 32, 6);
      });
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.8)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(850, groundY - 170);
      ctx.quadraticCurveTo(1250, groundY - 120, 1650, groundY - 170);
      ctx.stroke();

    } else if (env === 'town') {
      // Повноцінний міський ансамбль із будинками, вікнами, ліхтарями та крамницями

      // 1. Житлові будинки на фоні
      const townHouses = [
        { x: 300, w: 180, h: 260, color: '#1a2238' },
        { x: 740, w: 160, h: 240, color: '#161d30' },
        { x: 1480, w: 150, h: 250, color: '#182035' },
        { x: 1750, w: 200, h: 270, color: '#131b2e' }
      ];
      townHouses.forEach(th => {
        ctx.fillStyle = th.color;
        ctx.fillRect(th.x, groundY - th.h, th.w, th.h);
        // Вікна з теплим тьмяним світлом
        ctx.fillStyle = 'rgba(254, 240, 138, 0.18)';
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 2; c++) {
            ctx.fillRect(th.x + 25 + c * 60, groundY - th.h + 40 + r * 65, 30, 40);
          }
        }
      });

      // 2. Аптека з зеленим неоновим хрестом (x: 600)
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(520, groundY - 240, 160, 240);
      // Вітрина аптеки з полицями мікстур
      ctx.fillStyle = 'rgba(74, 222, 128, 0.25)';
      ctx.fillRect(540, groundY - 140, 120, 90);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 3;
      ctx.strokeRect(540, groundY - 140, 120, 90);
      // Світиться вивіска
      ctx.fillStyle = '#4ade80';
      ctx.font = 'bold 15px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('АПТЕКА +', 600, groundY - 180);

      // 3. Вуличний ліхтарний стовп з оголошенням про розшук Ендро (x: 960)
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(956, groundY - 190, 8, 190);
      ctx.beginPath();
      ctx.arc(960, groundY - 190, 12, 0, Math.PI * 2);
      ctx.fill();

      // Оголошення про розшук (Missing Poster): обличчя живого батька Ендро
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(948, groundY - 105, 24, 32);
      ctx.fillStyle = '#dc2626';
      ctx.font = 'bold 7px monospace';
      ctx.fillText('РОЗШУК', 960, groundY - 97);
      // Живий портрет батька Ендро на плакаті (тепле кругле обличчя в картатій сорочці)
      ctx.fillStyle = '#ea580c'; // сорочка
      ctx.fillRect(952, groundY - 84, 16, 8);
      ctx.fillStyle = '#fed7aa'; // обличчя
      ctx.beginPath();
      ctx.arc(960, groundY - 89, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#451a03'; // волосся
      ctx.beginPath();
      ctx.arc(960, groundY - 91, 5.2, Math.PI, Math.PI * 2);
      ctx.fill();

      // 4. Міська пекарня братів Морріс (x: 1140)
      ctx.fillStyle = '#261b17';
      ctx.fillRect(1060, groundY - 240, 160, 240);
      // Тепла вітрина з хлібом
      ctx.fillStyle = 'rgba(251, 191, 36, 0.35)';
      ctx.fillRect(1080, groundY - 135, 120, 85);
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 3;
      ctx.strokeRect(1080, groundY - 135, 120, 85);
      // Буханці хліба на поличках
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.ellipse(1110, groundY - 80, 14, 7, 0, 0, Math.PI * 2);
      ctx.ellipse(1145, groundY - 80, 14, 7, 0, 0, Math.PI * 2);
      ctx.ellipse(1180, groundY - 80, 14, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      // Вивіска пекарні
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 14px monospace';
      ctx.fillText('ПЕКАРНЯ', 1140, groundY - 180);

      // 5. Крамниця подарунків та солодощів (x: 1350)
      ctx.fillStyle = '#1e243b';
      ctx.fillRect(1280, groundY - 230, 150, 230);
      // Смугастий червоно-білий маркіз
      ctx.fillStyle = '#e11d48';
      ctx.fillRect(1280, groundY - 150, 150, 16);
      ctx.fillStyle = '#ffffff';
      for (let s = 1280; s < 1430; s += 20) {
        ctx.fillRect(s, groundY - 150, 10, 16);
      }
      ctx.fillStyle = 'rgba(251, 191, 36, 0.3)';
      ctx.fillRect(1295, groundY - 125, 120, 75);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 3;
      ctx.strokeRect(1295, groundY - 125, 120, 75);
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 14px monospace';
      ctx.fillText('КРАМНИЦЯ', 1355, groundY - 170);

      // 6. Вежа міської ратуші з годинником (x: 1580)
      ctx.fillStyle = '#1a202c';
      ctx.fillRect(1520, groundY - 320, 120, 320);
      // Готичний шпиль
      ctx.beginPath();
      ctx.moveTo(1510, groundY - 320);
      ctx.lineTo(1580, groundY - 420);
      ctx.lineTo(1650, groundY - 320);
      ctx.closePath();
      ctx.fill();
      // Великий сяючий годинник на вежі
      ctx.fillStyle = '#fef3c7';
      ctx.beginPath();
      ctx.arc(1580, groundY - 260, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      // Стрілки годинника (за 10 дванадцята)
      ctx.beginPath();
      ctx.moveTo(1580, groundY - 260);
      ctx.lineTo(1580, groundY - 276);
      ctx.moveTo(1580, groundY - 260);
      ctx.lineTo(1570, groundY - 265);
      ctx.stroke();

      // 7. Вікторіанські вуличні газові ліхтарі
      const lamps = [450, 760, 1250, 1720];
      lamps.forEach(lx => {
        ctx.fillStyle = '#334155';
        ctx.fillRect(lx - 3, groundY - 160, 6, 160);
        ctx.beginPath();
        ctx.arc(lx, groundY - 165, 10, 0, Math.PI * 2);
        ctx.fill();
        // Теплий конус світла на мокру бруківку
        const lightGlow = ctx.createRadialGradient(lx, groundY - 165, 5, lx, groundY - 165, 120);
        lightGlow.addColorStop(0, 'rgba(254, 240, 138, 0.45)');
        lightGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = lightGlow;
        ctx.beginPath();
        ctx.arc(lx, groundY - 165, 120, 0, Math.PI * 2);
        ctx.fill();
      });

    } else if (env === 'forest_grave') {
      // 1. Розбитий ліхтар на стежці (x: 750)
      ctx.fillStyle = '#78350f';
      ctx.fillRect(745, groundY - 12, 12, 12);
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 1;
      ctx.strokeRect(747, groundY - 10, 8, 8);
      ctx.fillStyle = 'rgba(30, 41, 59, 0.7)';
      ctx.beginPath();
      ctx.ellipse(750, groundY + 2, 22, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // 2. Свіжа свіжоскопана яма (x: 1150)
      ctx.fillStyle = '#05070d';
      ctx.beginPath();
      ctx.ellipse(1150, groundY + 12, 70, 22, 0, 0, Math.PI * 2);
      ctx.fill();

      // Купи мокрої рудої глини
      ctx.fillStyle = '#3f1d0b';
      ctx.beginPath();
      ctx.ellipse(1075, groundY + 4, 35, 16, 0, 0, Math.PI * 2);
      ctx.ellipse(1225, groundY + 4, 40, 18, 0, 0, Math.PI * 2);
      ctx.fill();

      // Срібний кишеньковий годинник Ендро на дні ями!
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.arc(1145, groundY + 8, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Батькова лопата в землі
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(1175, groundY - 60);
      ctx.lineTo(1160, groundY + 8);
      ctx.stroke();

      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(1170, groundY - 64);
      ctx.lineTo(1182, groundY - 56);
      ctx.stroke();
    }
  }

  private renderNPCs(ctx: CanvasRenderingContext2D, state: RenderState, groundY: number) {
    const ch = state.chapter;

    if (ch === 1) {
      this.renderEndroShadow(ctx, 1100, groundY);
    } else if (ch === 2 || ch === 5) {
      this.renderSusieInBed(ctx, 480, groundY);
      this.renderRebecca(ctx, 820, groundY);
    } else if (ch === 7) {
      this.renderSusieInBed(ctx, 480, groundY);
      this.renderRebecca(ctx, 820, groundY);
      this.renderEndroPeacefulSpirit(ctx, 250, groundY);
    } else if (ch === 3) {
      // У 3 розділі стоїть тільки силует містера Джиммі. Привиди батька НЕ з'являються — це флешбек у голові!
      this.renderJimmySilhouette(ctx, 950, groundY);
    } else if (ch === 4) {
      this.renderCatWithFish(ctx, 790, groundY);
      this.renderTownspeople(ctx, groundY);
      if (state.isNightmareVision || state.playerX > 1700) {
        this.renderJimmyVisionShovel(ctx, 1950, groundY);
      }
    } else if (ch === 6) {
      // У 6 розділі силует Джиммі виринає за спиною і завдає удару лопатою
      const isClimaxStruck = state.shakeAmount > 0.1 || !!state.isPlayerDown;
      this.renderJimmyClimax(ctx, state.playerX, groundY, isClimaxStruck);
    }
  }

  // Головний герой Боб: чіткі кольори, деталізований костюм, шарф та плавний крок
  private renderPlayer(ctx: CanvasRenderingContext2D, state: RenderState, groundY: number) {
    const x = state.playerX;
    const y = groundY;
    const facing = state.playerFacing === 'right' ? 1 : -1;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(facing, 1);

    // 1. Стан: БОБ ЗБИТИЙ З НІГ (удар у фіналі 6 розділу)
    if (state.isPlayerDown) {
      // Тінь
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.beginPath();
      ctx.ellipse(0, -3, 34, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      // Тіло Боба лежить на боці
      ctx.fillStyle = '#1d4ed8'; // синє пальто
      ctx.beginPath();
      ctx.roundRect(-24, -18, 48, 16, [6, 6, 4, 4]);
      ctx.fill();

      // Ноги витягнуті на землі
      ctx.strokeStyle = '#1e3a8a';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(-20, -10);
      ctx.lineTo(-42, -5);
      ctx.stroke();
      ctx.fillStyle = '#334155';
      ctx.fillRect(-48, -8, 10, 6);

      // Голова торкається землі
      ctx.fillStyle = '#fed7aa';
      ctx.beginPath();
      ctx.arc(28, -12, 9, 0, Math.PI * 2);
      ctx.fill();

      // Каштанове волосся
      ctx.fillStyle = '#451a03';
      ctx.beginPath();
      ctx.arc(28, -15, 9.5, Math.PI, Math.PI * 2);
      ctx.fill();

      // Заплющені очі (знепритомнів)
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(27, -12);
      ctx.lineTo(32, -12);
      ctx.stroke();

      // Шарф упав поруч на багнюку
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(20, -14);
      ctx.quadraticCurveTo(12, -4, -4, -2);
      ctx.stroke();

      // Розбитий ліхтар випав з руки поруч
      if (state.hasLantern) {
        this.renderLanternProp(ctx, 42, -5);
      }

      ctx.restore();
      return;
    }

    // 2. Стан: БОБ ГЛАДИТЬ КОТИКА (навпочіпки, лагідно простягає руку)
    if (state.isPettingCat) {
      // Тінь
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 22, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Зігнуті коліна / ноги
      ctx.strokeStyle = '#1d4ed8';
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-6, -26);
      ctx.lineTo(4, -12);
      ctx.lineTo(-6, -2);
      ctx.stroke();

      // Черевики
      ctx.fillStyle = '#475569';
      ctx.fillRect(-8, -5, 14, 5);

      // Тулуб Боба трохи нахилений вперед
      ctx.fillStyle = '#1d4ed8';
      ctx.beginPath();
      ctx.roundRect(-10, -48, 22, 28, [6, 6, 4, 4]);
      ctx.fill();

      // Шарф
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, -48);
      ctx.lineTo(-8, -40);
      ctx.stroke();

      // Голова схилена до котика
      ctx.fillStyle = '#fed7aa';
      ctx.beginPath();
      ctx.arc(8, -54, 9, 0, Math.PI * 2);
      ctx.fill();

      // Волосся
      ctx.fillStyle = '#451a03';
      ctx.beginPath();
      ctx.arc(8, -57, 9.5, Math.PI, Math.PI * 2);
      ctx.fill();

      // Тепла усмішка на обличчі Боба
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(12, -52, 3, 0.2, Math.PI * 0.8);
      ctx.stroke();

      // Простягнута рука, яка лагідно гладить котика
      const petHandWave = Math.sin(Date.now() * 0.008) * 3;
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(4, -40);
      ctx.lineTo(16, -34);
      ctx.lineTo(24 + petHandWave, -26);
      ctx.stroke();

      ctx.fillStyle = '#fed7aa';
      ctx.beginPath();
      ctx.arc(24 + petHandWave, -26, 3.5, 0, Math.PI * 2);
      ctx.fill();

      if (state.hasLantern) {
        this.renderLanternProp(ctx, -14, -20);
      }

      ctx.restore();
      return;
    }

    // 3. ЗВИЧАЙНА ХОДА ТА СТІЙКА БОБА З ПЛАВНОЮ АНІМАЦІЄЮ
    const walkPhase = this.walkAnimTime;
    const bodyBob = state.isMoving ? Math.sin(walkPhase * 2) * 2.8 : 0;

    // М'яка тінь
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 22, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Розрахунок природного згину колін для передньої та задньої ноги
    const leg1Angle = state.isMoving ? Math.sin(walkPhase) * 0.45 : 0;
    const leg2Angle = state.isMoving ? -Math.sin(walkPhase) * 0.45 : 0;

    // Задня нога
    ctx.save();
    ctx.translate(-3, -34 - bodyBob);
    ctx.rotate(leg2Angle);
    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 16);
    ctx.lineTo(state.isMoving ? Math.sin(leg2Angle) * 6 : 0, 32);
    ctx.stroke();
    // Черевик задній
    ctx.fillStyle = '#334155';
    ctx.fillRect(-2, 30, 12, 6);
    ctx.restore();

    // Передня нога
    ctx.save();
    ctx.translate(4, -34 - bodyBob);
    ctx.rotate(leg1Angle);
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 16);
    ctx.lineTo(state.isMoving ? Math.sin(leg1Angle) * 6 : 0, 32);
    ctx.stroke();
    // Черевик передній
    ctx.fillStyle = '#475569';
    ctx.fillRect(-1, 30, 13, 6);
    ctx.restore();

    // Синя куртка / пальто Боба з ґудзиками та кишенями
    ctx.fillStyle = '#1d4ed8';
    ctx.beginPath();
    ctx.roundRect(-10, -68 - bodyBob, 20, 36, [5, 5, 3, 3]);
    ctx.fill();

    // Ґудзики та кишеня
    ctx.fillStyle = '#1e40af';
    ctx.fillRect(4, -54 - bodyBob, 5, 2);
    ctx.fillRect(4, -46 - bodyBob, 5, 2);
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(0, -60 - bodyBob, 1.5, 0, Math.PI * 2);
    ctx.arc(0, -52 - bodyBob, 1.5, 0, Math.PI * 2);
    ctx.arc(0, -44 - bodyBob, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Комір пальта
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.moveTo(-11, -68 - bodyBob);
    ctx.lineTo(11, -68 - bodyBob);
    ctx.lineTo(8, -58 - bodyBob);
    ctx.lineTo(-8, -58 - bodyBob);
    ctx.closePath();
    ctx.fill();

    // Білий вовняний шарф, що динамічно майорить на вітрі
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-2, -66 - bodyBob);
    const windWave = Math.sin(Date.now() * 0.009) * 5;
    ctx.quadraticCurveTo(-18, -62 - bodyBob + windWave, -28, -56 - bodyBob + windWave * 1.5);
    ctx.stroke();

    // Голова Боба
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.arc(2, -76 - bodyBob, 9.5, 0, Math.PI * 2);
    ctx.fill();

    // Каштанове волосся
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.arc(2, -80 - bodyBob, 10, Math.PI, Math.PI * 2);
    ctx.lineTo(12, -76 - bodyBob);
    ctx.lineTo(-8, -76 - bodyBob);
    ctx.closePath();
    ctx.fill();

    // Очі
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(6, -76 - bodyBob, 1.6, 0, Math.PI * 2);
    ctx.fill();

    // Рука
    const armSwing = state.isMoving ? Math.sin(walkPhase) * 8 : 0;
    ctx.strokeStyle = '#1d4ed8';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';

    if (state.hasLantern) {
      // Боб несе піднятий палаючий ліхтар
      ctx.beginPath();
      ctx.moveTo(4, -60 - bodyBob);
      ctx.lineTo(16 + armSwing * 0.5, -50 - bodyBob);
      ctx.lineTo(24 + armSwing * 0.5, -45 - bodyBob);
      ctx.stroke();

      ctx.fillStyle = '#fed7aa';
      ctx.beginPath();
      ctx.arc(24 + armSwing * 0.5, -45 - bodyBob, 3, 0, Math.PI * 2);
      ctx.fill();

      // Ліхтар у руці
      this.renderLanternProp(ctx, 24 + armSwing * 0.5, -45 - bodyBob);
    } else {
      // БОБ БЕЗ ЛІХТАРЯ (наприклад, у 2 розділі вдома): рука вільно рухається або в кишені!
      ctx.beginPath();
      ctx.moveTo(3, -60 - bodyBob);
      ctx.lineTo(10 + armSwing, -48 - bodyBob);
      ctx.lineTo(6 + armSwing, -38 - bodyBob);
      ctx.stroke();

      ctx.fillStyle = '#fed7aa';
      ctx.beginPath();
      ctx.arc(6 + armSwing, -38 - bodyBob, 2.8, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private renderLanternProp(ctx: CanvasRenderingContext2D, lx: number, ly: number) {
    ctx.save();
    ctx.translate(lx, ly);

    // Ручка ліхтаря
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -6, 6, Math.PI, 0);
    ctx.stroke();

    // Металевий корпус
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-6, 0, 12, 16);

    // Сяюче тепле жовте скло
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(-4, 3, 8, 10);

    // Яскраве полум'я
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(0, 8, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Мати Сюзі: лежить у ліжку, спить під ковдрою, голова на м'якій подушці з диханням
  private renderSusieInBed(ctx: CanvasRenderingContext2D, x: number, groundY: number) {
    ctx.save();
    ctx.translate(x, groundY);

    // 1. Дерев'яне ліжко з різними спинками
    ctx.fillStyle = '#3e2723';
    // Узголів'я ліжка
    ctx.fillRect(-55, -75, 10, 75);
    ctx.fillRect(-58, -78, 16, 8);
    // Ізножжя ліжка
    ctx.fillRect(48, -50, 8, 50);
    ctx.fillRect(46, -53, 12, 6);
    // Бічна рама ліжка
    ctx.fillRect(-55, -28, 110, 12);
    // Ніжки
    ctx.fillRect(-52, -16, 6, 16);
    ctx.fillRect(48, -16, 6, 16);

    // 2. Велика біла пухова подушка
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.ellipse(-34, -46, 16, 11, -0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 3. Голова та спокійне обличчя Сюзі на подушці
    ctx.fillStyle = '#fde68a';
    ctx.beginPath();
    ctx.arc(-26, -52, 9, 0, Math.PI * 2);
    ctx.fill();

    // Темне хвилясте волосся, розпущене по подушці
    ctx.fillStyle = '#292524';
    ctx.beginPath();
    ctx.arc(-26, -55, 9.5, Math.PI, Math.PI * 2);
    ctx.quadraticCurveTo(-38, -48, -42, -40);
    ctx.lineTo(-24, -42);
    ctx.fill();

    // Заплющені вії хворої матері
    ctx.strokeStyle = '#44403c';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(-22, -51, 2.5, 0.1, Math.PI * 0.9);
    ctx.stroke();

    // 4. Тепла ковдра зі спокійним підняттям від дихання
    const breath = Math.sin(Date.now() * 0.002) * 2.2;
    ctx.fillStyle = '#1e3a8a'; // глибока синя тепла ковдра
    ctx.beginPath();
    ctx.roundRect(-42, -42 - breath, 90, 32 + breath, [8, 8, 2, 2]);
    ctx.fill();

    // Візерунок на ковдрі (затишні смуги)
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-40, -32 - breath * 0.6);
    ctx.lineTo(44, -32 - breath * 0.6);
    ctx.stroke();

    // Білий край простирадла, підігнутий під підборіддя
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.roundRect(-30, -44 - breath, 22, 6, 2);
    ctx.fill();

    ctx.restore();
  }

  // Сестричка Ребека: сидить на килимку і грається кубиками та ведмедиком з рухливими руками
  private renderRebecca(ctx: CanvasRenderingContext2D, x: number, groundY: number) {
    ctx.save();
    ctx.translate(x, groundY);

    // 1. М'який плетений килимок для гри
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.ellipse(0, -3, 36, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 2. Кольорові дерев'яні кубики поруч
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-24, -14, 10, 10);
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(-22, -23, 9, 9);
    ctx.fillStyle = '#eab308';
    ctx.fillRect(-12, -12, 8, 8);

    // 3. Ребека сидить зі схрещеними ніжками
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(-8, -8, 16, 6);
    // Рожеві туфельки
    ctx.fillStyle = '#f43f5e';
    ctx.fillRect(-11, -6, 7, 5);
    ctx.fillRect(4, -6, 7, 5);

    // 4. Рожева сукня Ребеки з білим комірцем
    ctx.fillStyle = '#ec4899';
    ctx.beginPath();
    ctx.moveTo(-9, -32);
    ctx.lineTo(9, -32);
    ctx.lineTo(14, -8);
    ctx.lineTo(-14, -8);
    ctx.closePath();
    ctx.fill();

    // Білий фартушок
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-6, -28, 12, 16);

    // 5. Голова Ребеки з бантиками та косичками
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.arc(0, -38, 8, 0, Math.PI * 2);
    ctx.fill();

    // Каштанове волосся та дві косички з бантиками
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.arc(0, -41, 8.5, Math.PI, Math.PI * 2);
    ctx.fill();

    // Червоні бантики з боків
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(-8, -38, 3, 0, Math.PI * 2);
    ctx.arc(8, -38, 3, 0, Math.PI * 2);
    ctx.fill();

    // Оченята
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(-2.5, -38, 1.2, 0, Math.PI * 2);
    ctx.arc(2.5, -38, 1.2, 0, Math.PI * 2);
    ctx.fill();

    // 6. АНІМАЦІЯ ГРИ: ручки Ребеки рухаються і тримають плюшевого ведмедика
    const playAnim = Math.sin(Date.now() * 0.005) * 4;

    // Плюшевий ведмедик на колінах
    ctx.fillStyle = '#854d0e';
    ctx.beginPath();
    ctx.arc(0, -18 + playAnim * 0.4, 6, 0, Math.PI * 2); // голова ведмедика
    ctx.arc(-4, -22 + playAnim * 0.4, 2.5, 0, Math.PI * 2); // вушка
    ctx.arc(4, -22 + playAnim * 0.4, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Ручки дівчинки обіймають ведмедика
    ctx.strokeStyle = '#fed7aa';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-8, -28);
    ctx.lineTo(-4, -20 + playAnim * 0.5);
    ctx.lineTo(0, -18 + playAnim * 0.5);
    ctx.moveTo(8, -28);
    ctx.lineTo(4, -20 + playAnim * 0.5);
    ctx.lineTo(0, -18 + playAnim * 0.5);
    ctx.stroke();

    ctx.restore();
  }

  // Вуличний кіт із рибиною в зубах (x: 790 у 4 розділі)
  private renderCatWithFish(ctx: CanvasRenderingContext2D, x: number, groundY: number) {
    ctx.save();
    ctx.translate(x, groundY);

    const tailWag = Math.sin(Date.now() * 0.007) * 8;

    // Тінь котика
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(0, -1, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Пухнастий хвостик угору
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-10, -12);
    ctx.quadraticCurveTo(-16, -24 + tailWag * 0.5, -12 + tailWag, -28);
    ctx.stroke();

    // Тіло котика (темно-сірий пухнастик)
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.ellipse(0, -12, 12, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Лапки
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-8, -6, 3, 6);
    ctx.fillRect(-2, -6, 3, 6);
    ctx.fillRect(4, -6, 3, 6);
    ctx.fillRect(8, -6, 3, 6);

    // Голова котика з гострими вушками
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(10, -18, 6.5, 0, Math.PI * 2);
    ctx.fill();

    // Вушка
    ctx.beginPath();
    ctx.moveTo(7, -23);
    ctx.lineTo(10, -29);
    ctx.lineTo(12, -23);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(11, -23);
    ctx.lineTo(14, -28);
    ctx.lineTo(16, -22);
    ctx.closePath();
    ctx.fill();

    // Зелені сяючі очі
    ctx.fillStyle = '#4ade80';
    ctx.beginPath();
    ctx.arc(12, -18, 1.2, 0, Math.PI * 2);
    ctx.fill();

    // Вуса
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(14, -16);
    ctx.lineTo(20, -17);
    ctx.moveTo(14, -15);
    ctx.lineTo(19, -13);
    ctx.stroke();

    // БЛИСКУЧА РИБИНА В ЗУБАХ КОТА!
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.ellipse(16, -15, 8, 3.5, 0.2, 0, Math.PI * 2);
    ctx.fill();
    // Хвостик риби
    ctx.beginPath();
    ctx.moveTo(23, -13);
    ctx.lineTo(27, -17);
    ctx.lineTo(27, -10);
    ctx.closePath();
    ctx.fill();
    // Око риби
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(11, -16, 1, 1);

    ctx.restore();
  }

  // Силуети містян під парасольками (4 розділ)
  private renderTownspeople(ctx: CanvasRenderingContext2D, groundY: number) {
    const people = [
      { x: 520, umbrellaColor: '#0f172a' },
      { x: 880, umbrellaColor: '#1e293b' },
      { x: 1420, umbrellaColor: '#334155' }
    ];

    people.forEach(p => {
      ctx.save();
      ctx.translate(p.x, groundY);

      // Тінь
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 18, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Пальто силуету
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(-8, -62);
      ctx.lineTo(8, -62);
      ctx.lineTo(12, 0);
      ctx.lineTo(-12, 0);
      ctx.closePath();
      ctx.fill();

      // Голова
      ctx.beginPath();
      ctx.arc(0, -68, 7, 0, Math.PI * 2);
      ctx.fill();

      // Купол парасольки
      ctx.fillStyle = p.umbrellaColor;
      ctx.beginPath();
      ctx.arc(0, -78, 26, Math.PI, Math.PI * 2);
      ctx.closePath();
      ctx.fill();

      // Держак парасольки
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, -78);
      ctx.lineTo(0, -56);
      ctx.stroke();

      ctx.restore();
    });
  }

  // Кульмінаційний удар Джиммі лопатою у 6 розділі
  private renderJimmyClimax(ctx: CanvasRenderingContext2D, playerX: number, groundY: number, isStruck: boolean) {
    ctx.save();
    // Джиммі з'являється позаду Боба
    ctx.translate(playerX - 42, groundY);

    // Моторошний силует у капелюсі
    ctx.fillStyle = '#090d16';
    ctx.beginPath();
    ctx.moveTo(-15, -88);
    ctx.lineTo(15, -88);
    ctx.lineTo(20, 0);
    ctx.lineTo(-20, 0);
    ctx.closePath();
    ctx.fill();

    // Голова та широкополий капелюх
    ctx.beginPath();
    ctx.arc(0, -96, 9.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, -104, 24, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-10, -116, 20, 13);

    // Очі Джиммі — крижані відблиски
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(2, -97, 2, 2);

    // Руки та лопата: якщо завдає удару — замах/удар униз
    ctx.save();
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';

    if (isStruck) {
      // Завершальний розмах удару лопатою вперед
      ctx.beginPath();
      ctx.moveTo(6, -80);
      ctx.lineTo(28, -70);
      ctx.lineTo(36, -42);
      ctx.stroke();

      // Металева лопата
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(24, -86);
      ctx.lineTo(44, -30);
      ctx.stroke();
    } else {
      // Підкрадається з піднятою лопатою над головою
      ctx.beginPath();
      ctx.moveTo(6, -80);
      ctx.lineTo(18, -105);
      ctx.stroke();

      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(12, -75);
      ctx.lineTo(22, -125);
      ctx.stroke();
    }
    ctx.restore();

    ctx.restore();
  }

  private renderJimmySilhouette(ctx: CanvasRenderingContext2D, x: number, groundY: number) {
    ctx.save();
    ctx.translate(x, groundY);

    // Довге темне пальто з виразним силуетом
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(-15, -88);
    ctx.lineTo(15, -88);
    ctx.lineTo(22, -10);
    ctx.lineTo(-22, -10);
    ctx.closePath();
    ctx.fill();

    // Комір
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(-16, -90);
    ctx.lineTo(16, -90);
    ctx.lineTo(10, -98);
    ctx.lineTo(-10, -98);
    ctx.closePath();
    ctx.fill();

    // Бліде обличчя в тіні
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.arc(0, -100, 10, 0, Math.PI * 2);
    ctx.fill();

    // Широкополий капелюх
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.ellipse(0, -106, 25, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-11, -118, 22, 14);

    ctx.restore();
  }

  private renderJimmyVisionShovel(ctx: CanvasRenderingContext2D, x: number, groundY: number) {
    ctx.save();
    ctx.translate(x, groundY);

    const strikePhase = Math.sin(Date.now() * 0.007);
    const armAngle = strikePhase * 0.8;

    ctx.fillStyle = '#090d16';
    ctx.beginPath();
    ctx.moveTo(-14, -80);
    ctx.lineTo(14, -80);
    ctx.lineTo(18, -10);
    ctx.lineTo(-18, -10);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, -92, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, -98, 22, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(4, -70);
    ctx.rotate(armAngle);
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(25, 20);
    ctx.stroke();

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(10, 5);
    ctx.lineTo(45, 45);
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  }

  private renderEndroShadow(ctx: CanvasRenderingContext2D, x: number, groundY: number) {
    ctx.save();
    ctx.translate(x, groundY);

    const float = Math.sin(Date.now() * 0.003) * 6;

    // Примарне блакитне сяйво
    const mistGlow = ctx.createRadialGradient(0, -50 + float, 10, 0, -50 + float, 80);
    mistGlow.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
    mistGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = mistGlow;
    ctx.beginPath();
    ctx.arc(0, -50 + float, 80, 0, Math.PI * 2);
    ctx.fill();

    // Силует примари
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(-14, -80 + float);
    ctx.lineTo(14, -80 + float);
    ctx.lineTo(20, float);
    ctx.lineTo(-20, float);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, -90 + float, 11, 0, Math.PI * 2);
    ctx.fill();

    // Яскраві сяючі очі примари
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(-4, -90 + float, 2.5, 0, Math.PI * 2);
    ctx.arc(4, -90 + float, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Теплий світлий дух батька Ендро у 7 розділі, який оберігає родину
  private renderEndroPeacefulSpirit(ctx: CanvasRenderingContext2D, x: number, groundY: number) {
    ctx.save();
    ctx.translate(x, groundY);

    const float = Math.sin(Date.now() * 0.003) * 5;

    // Тепле золотисто-блакитне сяйво миру
    const peaceGlow = ctx.createRadialGradient(0, -55 + float, 10, 0, -55 + float, 75);
    peaceGlow.addColorStop(0, 'rgba(254, 240, 138, 0.35)');
    peaceGlow.addColorStop(0.5, 'rgba(56, 189, 248, 0.2)');
    peaceGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = peaceGlow;
    ctx.beginPath();
    ctx.arc(0, -55 + float, 75, 0, Math.PI * 2);
    ctx.fill();

    // Силует батька в сорочці
    ctx.fillStyle = 'rgba(254, 240, 138, 0.75)';
    ctx.beginPath();
    ctx.roundRect(-12, -72 + float, 24, 38, [5, 5, 2, 2]);
    ctx.fill();

    // Голова батька
    ctx.beginPath();
    ctx.arc(0, -84 + float, 10, 0, Math.PI * 2);
    ctx.fill();

    // Тепла посмішка
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(3, -82 + float, 3.5, 0.1, Math.PI * 0.9);
    ctx.stroke();

    // Очі, сповнені вдячності
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(4, -84 + float, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Піднята рука на знак благословення та вдячності
    ctx.strokeStyle = 'rgba(254, 240, 138, 0.85)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(8, -65 + float);
    ctx.lineTo(20, -78 + float);
    ctx.stroke();

    ctx.restore();
  }

  private renderHotspotIndicator(ctx: CanvasRenderingContext2D, spot: Hotspot, groundY: number) {
    const pulse = Math.sin(Date.now() * 0.006) * 4;
    const hx = spot.x;
    const hy = groundY - 110 + pulse;

    ctx.save();
    ctx.translate(hx, hy);

    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-48, -18, 96, 36, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 13px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('E  Дія', 0, 0);

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(-6, 18);
    ctx.lineTo(6, 18);
    ctx.lineTo(0, 25);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  private renderForegroundVignetteBranches(ctx: CanvasRenderingContext2D, w: number, h: number, offset: number) {
    ctx.fillStyle = '#060a14';

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(w * 0.35, 0);
    ctx.bezierCurveTo(w * 0.2, h * 0.15, w * 0.1, h * 0.22, 0, h * 0.28);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(w, 0);
    ctx.lineTo(w * 0.65, 0);
    ctx.bezierCurveTo(w * 0.8, h * 0.12, w * 0.9, h * 0.2, w, h * 0.25);
    ctx.closePath();
    ctx.fill();
  }

  private renderWeather(ctx: CanvasRenderingContext2D, w: number, h: number, groundY: number, deltaTime: number) {
    ctx.strokeStyle = 'rgba(190, 220, 255, 0.45)';
    ctx.lineWidth = 1.3;

    this.rainDrops.forEach(drop => {
      drop.y += drop.speed * (deltaTime * 60);
      drop.x -= 2.5 * (deltaTime * 60);

      if (drop.y > groundY + Math.random() * 20) {
        if (Math.random() < 0.25) {
          this.ripples.push({
            x: drop.x,
            y: drop.y,
            radius: 2,
            maxRadius: 10 + Math.random() * 8,
            alpha: 0.6
          });
        }
        drop.y = -10;
        drop.x = Math.random() * (w + 400);
      }

      ctx.beginPath();
      ctx.moveTo(drop.x, drop.y);
      ctx.lineTo(drop.x - 4, drop.y + drop.length);
      ctx.stroke();
    });

    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const rip = this.ripples[i];
      rip.radius += deltaTime * 22;
      rip.alpha -= deltaTime * 1.3;

      if (rip.alpha <= 0 || rip.radius >= rip.maxRadius) {
        this.ripples.splice(i, 1);
        continue;
      }

      ctx.strokeStyle = `rgba(180, 220, 255, ${Math.max(0, rip.alpha)})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(rip.x, rip.y, rip.radius, rip.radius * 0.3, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // Виправлена система освітлення: прозоре коло навколо Боба без стирання пікселів
  private renderLightingMask(ctx: CanvasRenderingContext2D, w: number, h: number, state: RenderState, groundY: number) {
    const screenBobX = state.playerX - this.cameraX;
    const screenBobY = groundY - 45;

    ctx.save();

    const breath = Math.sin(Date.now() * 0.0035) * 10;
    const flicker = state.anxiety > 40 ? (Math.random() - 0.5) * (state.anxiety * 0.2) : 0;
    const lightRadius = Math.max(240, 320 + breath + flicker);

    // Зовнішня темрява
    let maxDarkness = 0.72;
    if (state.environment === 'home') maxDarkness = 0.12; // Будинок теплий і гарно освітлений
    if (state.environment === 'home_night') maxDarkness = 0.35;
    if (state.environment === 'town') maxDarkness = 0.48;

    // Радіальний градієнт темряви: 0% біля Боба, плавне затемнення до країв екрана
    const darkGradient = ctx.createRadialGradient(
      screenBobX, screenBobY, 35,
      screenBobX, screenBobY, lightRadius
    );
    darkGradient.addColorStop(0, 'rgba(4, 6, 14, 0.0)');
    darkGradient.addColorStop(0.35, 'rgba(4, 6, 14, 0.04)');
    darkGradient.addColorStop(0.7, `rgba(4, 6, 14, ${maxDarkness * 0.65})`);
    darkGradient.addColorStop(1, `rgba(4, 6, 14, ${maxDarkness})`);

    ctx.fillStyle = darkGradient;
    ctx.fillRect(0, 0, w, h);

    // Додаткові тепли вогні у місті (вітрини, ліхтарі, аптека)
    if (state.environment === 'town') {
      [450, 600, 760, 960, 1140, 1350, 1580, 1720].forEach(tx => {
        const screenTx = tx - this.cameraX;
        if (screenTx > -120 && screenTx < w + 120) {
          const shopGrad = ctx.createRadialGradient(screenTx, groundY - 120, 10, screenTx, groundY - 120, 180);
          shopGrad.addColorStop(0, 'rgba(254, 240, 138, 0.22)');
          shopGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = shopGrad;
          ctx.beginPath();
          ctx.arc(screenTx, groundY - 120, 180, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }

    // М'яка тепла підсвітка ліхтаря — ТІЛЬКИ коли Боб несе ліхтар у руках!
    if (state.hasLantern) {
      const warmHalo = ctx.createRadialGradient(
        screenBobX, screenBobY, 5,
        screenBobX, screenBobY, lightRadius * 0.55
      );
      warmHalo.addColorStop(0, 'rgba(254, 240, 138, 0.2)');
      warmHalo.addColorStop(0.5, 'rgba(245, 158, 11, 0.08)');
      warmHalo.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = warmHalo;
      ctx.beginPath();
      ctx.arc(screenBobX, screenBobY, lightRadius * 0.55, 0, Math.PI * 2);
      ctx.fill();
    }

    // Віньєтка по кутках
    const vignette = ctx.createRadialGradient(w * 0.5, h * 0.5, w * 0.45, w * 0.5, h * 0.5, w * 0.85);
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);

    ctx.restore();
  }

  private renderHorrorPostEffects(ctx: CanvasRenderingContext2D, w: number, h: number, state: RenderState) {
    if (state.redFlashAmount > 0) {
      ctx.fillStyle = `rgba(220, 38, 38, ${Math.min(0.85, state.redFlashAmount)})`;
      ctx.fillRect(0, 0, w, h);
    }

    if (state.glitchAmount > 0 || (state.anxiety > 75 && Math.random() < 0.12)) {
      const strips = 4 + Math.floor(Math.random() * 6);
      for (let s = 0; s < strips; s++) {
        const sy = Math.random() * h;
        const sh = 4 + Math.random() * 12;
        const shift = (Math.random() - 0.5) * 32;

        ctx.fillStyle = Math.random() > 0.5 ? 'rgba(239, 68, 68, 0.25)' : 'rgba(56, 189, 248, 0.25)';
        ctx.fillRect(shift, sy, w, sh);
      }
    }

    // Легкий шум
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    const grainCount = Math.floor(w * h * 0.0004);
    for (let g = 0; g < grainCount; g++) {
      const gx = Math.random() * w;
      const gy = Math.random() * h;
      ctx.fillRect(gx, gy, 1.5, 1.5);
    }
  }
}
