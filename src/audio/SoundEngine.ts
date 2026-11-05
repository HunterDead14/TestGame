/**
 * SoundEngine.ts
 * Повноцінний процедурний звуковий рушій на Web Audio API.
 * Жодних зовнішніх аудіофайлів — усі звуки синтезуються кодом.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.75;
  private isInitialized: boolean = false;

  // Аутпути середовища
  private rainNode: AudioNode | null = null;
  private rainGain: GainNode | null = null;
  private windNode: AudioNode | null = null;
  private windGain: GainNode | null = null;
  private droneGain: GainNode | null = null;
  private droneOscs: OscillatorNode[] = [];

  // Серцебиття
  private heartbeatInterval: number | null = null;
  private currentAnxiety: number = 0;

  // Затишний музичний мотив будинку
  private homeMusicInterval: number | null = null;

  public init(): boolean {
    if (this.isInitialized && this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return true;
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
      this.isInitialized = true;
      return true;
    } catch (e) {
      console.warn('Web Audio API не вдалося ініціалізувати:', e);
      return false;
    }
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime, 0.05);
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  // Генератор білого шуму
  private createNoiseBuffer(): AudioBuffer | null {
    if (!this.ctx) return null;
    const bufferSize = this.ctx.sampleRate * 3;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  // Запуск фонового дощу
  public startRain(intensity: number = 0.5) {
    if (!this.init() || !this.ctx || !this.masterGain) return;
    this.stopRain();

    const noiseBuffer = this.createNoiseBuffer();
    if (!noiseBuffer) return;

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    // Смуговий фільтр для імітації шуму крапель
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200 + intensity * 800, this.ctx.currentTime);
    filter.Q.setValueAtTime(1.2, this.ctx.currentTime);

    const highpass = this.ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.setValueAtTime(400, this.ctx.currentTime);

    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    this.rainGain.gain.exponentialRampToValueAtTime(0.22 * intensity, this.ctx.currentTime + 1.5);

    noiseSource.connect(filter);
    filter.connect(highpass);
    highpass.connect(this.rainGain);
    this.rainGain.connect(this.masterGain);

    noiseSource.start();
    this.rainNode = noiseSource;
  }

  public stopRain() {
    if (this.rainGain && this.ctx) {
      try {
        this.rainGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.3);
      } catch {
        // ignore
      }
    }
    setTimeout(() => {
      if (this.rainNode) {
        try {
          (this.rainNode as AudioBufferSourceNode).stop();
        } catch {
          // ignore
        }
        this.rainNode = null;
      }
    }, 400);
  }

  // Запуск фонового вітру
  public startWind(intensity: number = 0.4) {
    if (!this.init() || !this.ctx || !this.masterGain) return;
    this.stopWind();

    const noiseBuffer = this.createNoiseBuffer();
    if (!noiseBuffer) return;

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(320, this.ctx.currentTime);
    filter.Q.setValueAtTime(3.5, this.ctx.currentTime);

    // LFO для повільного виття вітру
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.25, this.ctx.currentTime);

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(180, this.ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    this.windGain = this.ctx.createGain();
    this.windGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    this.windGain.gain.exponentialRampToValueAtTime(0.18 * intensity, this.ctx.currentTime + 2.0);

    noiseSource.connect(filter);
    filter.connect(this.windGain);
    this.windGain.connect(this.masterGain);

    noiseSource.start();
    lfo.start();
    this.windNode = noiseSource;
  }

  public stopWind() {
    if (this.windGain && this.ctx) {
      try {
        this.windGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.4);
      } catch {
        // ignore
      }
    }
    setTimeout(() => {
      if (this.windNode) {
        try {
          (this.windNode as AudioBufferSourceNode).stop();
        } catch {
          // ignore
        }
        this.windNode = null;
      }
    }, 500);
  }

  // Моторошний низький дрон
  public startDrone(anxiety: number = 0) {
    if (!this.init() || !this.ctx || !this.masterGain) return;
    this.stopDrone();

    this.droneGain = this.ctx.createGain();
    this.droneGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    this.droneGain.gain.exponentialRampToValueAtTime(0.15 + (anxiety / 100) * 0.1, this.ctx.currentTime + 2);
    this.droneGain.connect(this.masterGain);

    // Три детюновані низькі осцилятори
    const freqs = [55, 55.4, 82.5]; // A1, трохи розстроєна A1, E2
    this.droneOscs = freqs.map((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      osc.type = idx === 0 ? 'sine' : idx === 1 ? 'triangle' : 'sawtooth';
      osc.frequency.setValueAtTime(freq, this.ctx!.currentTime);

      const filter = this.ctx!.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(140 + anxiety * 2, this.ctx!.currentTime);

      osc.connect(filter);
      filter.connect(this.droneGain!);
      osc.start();
      return osc;
    });
  }

  public stopDrone() {
    if (this.droneGain && this.ctx) {
      try {
        this.droneGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.5);
      } catch {
        // ignore
      }
    }
    setTimeout(() => {
      this.droneOscs.forEach(o => {
        try {
          o.stop();
        } catch {
          // ignore
        }
      });
      this.droneOscs = [];
    }, 600);
  }

  // Оновлення серцебиття відповідно до рівня тривоги (0–100)
  public setAnxiety(anxiety: number) {
    this.currentAnxiety = Math.max(0, Math.min(100, anxiety));

    // Якщо тривога висока, запускаємо або оновлюємо пульс
    if (this.currentAnxiety > 15) {
      this.restartHeartbeat();
    } else {
      this.stopHeartbeat();
    }

    // Підлаштовуємо дрон якщо активний
    if (this.droneGain && this.ctx) {
      this.droneGain.gain.setTargetAtTime(0.12 + (this.currentAnxiety / 100) * 0.15, this.ctx.currentTime, 0.5);
    }
  }

  private restartHeartbeat() {
    this.stopHeartbeat();
    if (!this.init() || !this.ctx) return;

    // Інтервал між ударами: від 1100 мс (при 15 тривоги ~55 bpm) до 420 мс (при 100 тривоги ~142 bpm)
    const intervalMs = Math.max(420, 1100 - (this.currentAnxiety / 100) * 680);

    const playBeats = () => {
      this.playSingleHeartbeat(this.currentAnxiety);
    };

    playBeats();
    this.heartbeatInterval = window.setInterval(playBeats, intervalMs);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval !== null) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private playSingleHeartbeat(anxiety: number) {
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const volumeFactor = Math.min(1.0, 0.25 + (anxiety / 100) * 0.55);

    // Перший глухий удар (lub)
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(80, t);
    osc1.frequency.exponentialRampToValueAtTime(32, t + 0.12);

    gain1.gain.setValueAtTime(0.001, t);
    gain1.gain.linearRampToValueAtTime(0.4 * volumeFactor, t + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc1.connect(gain1);
    gain1.connect(this.masterGain);
    osc1.start(t);
    osc1.stop(t + 0.16);

    // Другий дзвінкіший удар (dub) через 140 мс
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(70, t + 0.14);
    osc2.frequency.exponentialRampToValueAtTime(28, t + 0.25);

    gain2.gain.setValueAtTime(0.001, t + 0.14);
    gain2.gain.linearRampToValueAtTime(0.28 * volumeFactor, t + 0.16);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.27);

    osc2.connect(gain2);
    gain2.connect(this.masterGain);
    osc2.start(t + 0.14);
    osc2.stop(t + 0.28);
  }

  // Кроки: земля, дерево, калюжа
  public playFootstep(surface: 'dirt' | 'wood' | 'puddle') {
    if (!this.init() || !this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    if (surface === 'wood') {
      // Сухий глухий дерев'яний звук
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140 + Math.random() * 20, t);
      osc.frequency.exponentialRampToValueAtTime(45, t + 0.09);

      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.11);
    } else if (surface === 'puddle') {
      // Сплеск води
      const noiseBuffer = this.createNoiseBuffer();
      if (!noiseBuffer) return;
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(900 + Math.random() * 300, t);
      filter.Q.setValueAtTime(2.0, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

      // Маленька крапля вгору
      const drip = this.ctx.createOscillator();
      const dripGain = this.ctx.createGain();
      drip.type = 'sine';
      drip.frequency.setValueAtTime(800, t);
      drip.frequency.exponentialRampToValueAtTime(1300 + Math.random() * 200, t + 0.08);

      dripGain.gain.setValueAtTime(0.08, t);
      dripGain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

      drip.connect(dripGain);
      dripGain.connect(this.masterGain);
      drip.start(t);
      drip.stop(t + 0.1);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      noise.start(t);
      noise.stop(t + 0.13);
    } else {
      // Земля / волога трава
      const noiseBuffer = this.createNoiseBuffer();
      if (!noiseBuffer) return;
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450 + Math.random() * 100, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      noise.start(t);
      noise.stop(t + 0.12);
    }
  }

  // Звук друкарської машинки / діалогового клацання
  public playTypewriterClick() {
    if (!this.init() || !this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400 + Math.random() * 400, t);
    osc.frequency.exponentialRampToValueAtTime(300, t + 0.025);

    gain.gain.setValueAtTime(0.035, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.025);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.03);
  }

  // Голосові 8-бітні "бліпи" мовлення в стилі Undertale для кожного персонажа
  public playDialogueVoiceBeep(speaker: string, char?: string) {
    if (!this.init() || !this.ctx || !this.masterGain) return;

    // Ігноруємо пробіли та розділові знаки
    if (char && (char === ' ' || char === '\n' || char === '\t' || char === '.' || char === ',' || char === '!' || char === '?' || char === '—' || char === '-')) {
      return;
    }

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    let baseFreq = 260;
    let waveType: OscillatorType = 'triangle';
    let filterFreq = 1600;
    let duration = 0.045;
    let vol = 0.09;
    let pitchBend = 0;

    switch (speaker) {
      case 'bob':
        // Боб (17 років): теплий, чіткий хлопчачий тон у стилі головного героя Undertale
        baseFreq = 250 + (Math.random() - 0.5) * 16;
        waveType = 'triangle';
        filter.type = 'lowpass';
        filterFreq = 1800;
        duration = 0.042;
        vol = 0.085;
        break;

      case 'susie':
        // Мати Сюзі: м'який, тихий, втомлений материнський тон (як Торель)
        baseFreq = 175 + (Math.random() - 0.5) * 10;
        waveType = 'sine';
        filter.type = 'lowpass';
        filterFreq = 850;
        duration = 0.048;
        vol = 0.08;
        break;

      case 'rebecca':
        // Сестричка Ребека: дзвінкий, грайливий, вищий дитячий чіптюн-чірп
        baseFreq = 480 + (Math.random() - 0.5) * 24;
        waveType = 'square';
        filter.type = 'lowpass';
        filterFreq = 2400;
        duration = 0.038;
        vol = 0.065;
        break;

      case 'jimmy':
        // Джиммі: низький, хрипкий, моторошний і глибокий бас-бліп (як Санс / Азгор)
        baseFreq = 105 + (Math.random() - 0.5) * 8;
        waveType = 'sawtooth';
        filter.type = 'lowpass';
        filterFreq = 450;
        duration = 0.052;
        vol = 0.12;
        break;

      case 'endro':
        // Привид батька: загробний, порожнистий, містичний спадний бліп
        baseFreq = 145 + (Math.random() - 0.5) * 8;
        pitchBend = -22;
        waveType = 'triangle';
        filter.type = 'bandpass';
        filterFreq = 680;
        filter.Q.setValueAtTime(3.5, t);
        duration = 0.06;
        vol = 0.095;
        break;

      case 'endro_alive':
        // Живий батько: глибокий, спокійний, доброзичливий чоловічий голос
        baseFreq = 160 + (Math.random() - 0.5) * 10;
        waveType = 'triangle';
        filter.type = 'lowpass';
        filterFreq = 1100;
        duration = 0.046;
        vol = 0.09;
        break;

      case 'cat':
        // Вуличний кіт: тоненький милий муркотливий пік-чірп
        baseFreq = 580;
        pitchBend = 60;
        waveType = 'sine';
        filter.type = 'lowpass';
        filterFreq = 2600;
        duration = 0.045;
        vol = 0.075;
        break;

      case 'system':
      default:
        // Системні репліки / тривога: нейтральний клавішний тон
        baseFreq = 340 + (Math.random() - 0.5) * 20;
        waveType = 'sine';
        filter.type = 'lowpass';
        filterFreq = 1200;
        duration = 0.032;
        vol = 0.06;
        break;
    }

    osc.type = waveType;
    osc.frequency.setValueAtTime(baseFreq, t);
    if (pitchBend !== 0) {
      osc.frequency.linearRampToValueAtTime(baseFreq + pitchBend, t + duration);
    }

    filter.frequency.setValueAtTime(filterFreq, t);

    // Різка атака та швидкий спад, характерний для Undertale
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + duration + 0.01);
  }

  // Звук вибору діалогу / кліку UI
  public playSelectSound() {
    if (!this.init() || !this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.06);

    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.08);
  }

  // Різкий хорор-стінгер (жахливе видіння, різкий звук)
  public playStinger(intensity: number = 1.0) {
    if (!this.init() || !this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    // Дисгармонійні пилкоподібні хвилі
    const freqs = [311.13, 329.63, 440, 466.16]; // Eb4, E4, A4, Bb4 - дисонансні тритони
    freqs.forEach(freq => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq * 1.8, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.4, t + 0.6);

      const filter = this.ctx!.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(800, t);
      filter.frequency.exponentialRampToValueAtTime(120, t + 0.5);

      gain.gain.setValueAtTime(0.25 * intensity, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(t);
      osc.stop(t + 0.75);
    });

    // Шумний сплеск
    const noiseBuffer = this.createNoiseBuffer();
    if (noiseBuffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.3 * intensity, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
      noise.connect(noiseGain);
      noiseGain.connect(this.masterGain);
      noise.start(t);
      noise.stop(t + 0.5);
    }
  }

  // Глухий важкий удар у спину (фінал розділу 6)
  public playHeavyHit() {
    if (!this.init() || !this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    // Глибокий саб-удар
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(130, t);
    osc.frequency.exponentialRampToValueAtTime(18, t + 0.4);

    gain.gain.setValueAtTime(0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.55);

    // Хрускіт / шум
    const noiseBuffer = this.createNoiseBuffer();
    if (noiseBuffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(380, t);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.4, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.masterGain);
      noise.start(t);
      noise.stop(t + 0.28);
    }
  }

  // Містичний шепіт батька
  public playWhisperSound() {
    if (!this.init() || !this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    const noiseBuffer = this.createNoiseBuffer();
    if (!noiseBuffer) return;

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1800, t);
    filter.Q.setValueAtTime(8, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.2, t + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(t);
    noise.stop(t + 1.25);
  }

  // Муркотіння кота (Web Audio FM-синтез низького вібруючого мурчання)
  public playCatPurr() {
    if (!this.init() || !this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    // Модулятор (низька частота 24 Гц для вібрації гортані)
    const mod = this.ctx.createOscillator();
    mod.type = 'sine';
    mod.frequency.setValueAtTime(26, t);

    const modGain = this.ctx.createGain();
    modGain.gain.setValueAtTime(35, t);
    mod.connect(modGain);

    // Носій (теплий низький тон 95 Гц)
    const carrier = this.ctx.createOscillator();
    carrier.type = 'triangle';
    carrier.frequency.setValueAtTime(95, t);
    modGain.connect(carrier.frequency);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, t);

    const purrGain = this.ctx.createGain();
    purrGain.gain.setValueAtTime(0.001, t);
    purrGain.gain.linearRampToValueAtTime(0.28, t + 0.3);
    purrGain.gain.setValueAtTime(0.28, t + 1.8);
    purrGain.gain.exponentialRampToValueAtTime(0.001, t + 2.4);

    carrier.connect(filter);
    filter.connect(purrGain);
    purrGain.connect(this.masterGain);

    carrier.start(t);
    mod.start(t);
    carrier.stop(t + 2.45);
    mod.stop(t + 2.45);
  }

  // Затишний мотив дому у стилі піксельного фолк-гітарного / банджо перебору
  public startHomeMelody() {
    if (!this.init() || !this.ctx) return;
    this.stopHomeMelody();

    // Ностальгійний акордний перебір (Am - Fmaj7 - C - G/B) на щипкових струнах
    // Ноти: частоти та тривалості
    const pattern = [
      // Am
      { note: 110.0, time: 0.0, isBass: true },   // A2
      { note: 220.0, time: 0.25, isBass: false }, // A3
      { note: 261.63, time: 0.5, isBass: false }, // C4
      { note: 329.63, time: 0.75, isBass: false },// E4
      { note: 440.0, time: 1.0, isBass: false },  // A4
      { note: 329.63, time: 1.25, isBass: false },// E4
      // Fmaj7
      { note: 87.31, time: 1.6, isBass: true },   // F2
      { note: 261.63, time: 1.85, isBass: false },// C4
      { note: 329.63, time: 2.1, isBass: false }, // E4
      { note: 349.23, time: 2.35, isBass: false },// F4
      { note: 261.63, time: 2.6, isBass: false }, // C4
      // C
      { note: 130.81, time: 3.0, isBass: true },  // C3
      { note: 261.63, time: 3.25, isBass: false },// C4
      { note: 329.63, time: 3.5, isBass: false }, // E4
      { note: 392.00, time: 3.75, isBass: false },// G4
      { note: 523.25, time: 4.0, isBass: false }, // C5
      { note: 392.00, time: 4.25, isBass: false },// G4
      // G/B -> Am resolve
      { note: 123.47, time: 4.6, isBass: true },  // B2
      { note: 246.94, time: 4.85, isBass: false },// B3
      { note: 293.66, time: 5.1, isBass: false }, // D4
      { note: 392.00, time: 5.35, isBass: false },// G4
      { note: 440.00, time: 5.7, isBass: false }  // A4
    ];

    const playPluck = (freq: number, startTime: number, isBass: boolean) => {
      if (!this.ctx || !this.masterGain) return;

      // Щипкова струна (банджо / акустична гітара з чіптюн-характером):
      // Трикутна хвиля + короткий імпульс шуму на старті для звуку медіатора/пальця
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = isBass ? 'triangle' : 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      // Легкий bend / vibrato
      osc.frequency.exponentialRampToValueAtTime(freq * 0.998, startTime + 0.3);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(isBass ? 450 : 2200, startTime);
      filter.frequency.exponentialRampToValueAtTime(isBass ? 120 : 600, startTime + (isBass ? 0.7 : 0.45));

      const vol = isBass ? 0.08 : 0.065;
      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.linearRampToValueAtTime(vol, startTime + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + (isBass ? 0.9 : 0.65));

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(startTime);
      osc.stop(startTime + 0.95);

      // Клацання медіатора
      const noise = this.ctx.createBufferSource();
      const noiseBuf = this.createNoiseBuffer();
      if (noiseBuf) {
        noise.buffer = noiseBuf;
        const nFilter = this.ctx.createBiquadFilter();
        nFilter.type = 'bandpass';
        nFilter.frequency.setValueAtTime(isBass ? 800 : 2800, startTime);
        nFilter.Q.setValueAtTime(4, startTime);

        const nGain = this.ctx.createGain();
        nGain.gain.setValueAtTime(0.02, startTime);
        nGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.035);

        noise.connect(nFilter);
        nFilter.connect(nGain);
        nGain.connect(this.masterGain);

        noise.start(startTime);
        noise.stop(startTime + 0.04);
      }
    };

    const playFullPattern = () => {
      if (!this.ctx || !this.masterGain) return;
      const baseTime = this.ctx.currentTime + 0.05;

      pattern.forEach(step => {
        playPluck(step.note, baseTime + step.time, step.isBass);
      });
    };

    playFullPattern();
    this.homeMusicInterval = window.setInterval(playFullPattern, 7200);
  }

  public stopHomeMelody() {
    if (this.homeMusicInterval !== null) {
      clearInterval(this.homeMusicInterval);
      this.homeMusicInterval = null;
    }
  }

  // Перемикання звукового середовища
  public setAtmosphere(env: string, anxiety: number = 0) {
    this.setAnxiety(anxiety);

    if (env === 'home' || env === 'home_night') {
      this.stopRain();
      this.stopWind();
      this.stopDrone();
      this.startHomeMelody();
    } else if (env === 'graveyard') {
      this.stopHomeMelody();
      this.startRain(0.7);
      this.startWind(0.5);
      this.startDrone(anxiety + 20);
    } else if (env === 'forest_road' || env === 'forest_grave') {
      this.stopHomeMelody();
      this.startRain(0.85);
      this.startWind(0.65);
      this.startDrone(anxiety + 10);
    } else if (env === 'town') {
      this.stopHomeMelody();
      this.startRain(0.5);
      this.startWind(0.3);
      this.startDrone(anxiety);
    }
  }

  public stopAll() {
    this.stopRain();
    this.stopWind();
    this.stopDrone();
    this.stopHeartbeat();
    this.stopHomeMelody();
  }
}

export const soundEngine = new SoundEngine();
