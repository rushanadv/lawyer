// Sound Engine for LEX VERA
// Handles Web Audio gavel strike synthesis and oral argument audio narration with frequency analysis

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private activeLawyerId: string | null = null;
  private progressInterval: number | null = null;

  constructor() {
    // Check local storage for mute preference
    const savedMute = typeof window !== 'undefined' ? localStorage.getItem('lex_sound_muted') : null;
    this.isMuted = savedMute === 'true';
  }

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('lex_sound_muted', String(this.isMuted));
    }
    if (this.isMuted) {
      this.stopSpeech();
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  // Synthesize realistic wooden judge's gavel strike on sound block
  public playGavelImpact() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;

      // 1. Transient click (the hardwood edge contact)
      const clickOsc = this.ctx.createOscillator();
      const clickGain = this.ctx.createGain();
      clickOsc.type = 'triangle';
      clickOsc.frequency.setValueAtTime(320, now);
      clickOsc.frequency.exponentialRampToValueAtTime(80, now + 0.05);
      clickGain.gain.setValueAtTime(0.8, now);
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      clickOsc.connect(clickGain);
      clickGain.connect(this.ctx.destination);
      clickOsc.start(now);
      clickOsc.stop(now + 0.09);

      // 2. Heavy Sub-bass wood thud (mass of the gavel and courtroom desk resonance)
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(110, now);
      subOsc.frequency.exponentialRampToValueAtTime(42, now + 0.35);
      subGain.gain.setValueAtTime(1.0, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

      subOsc.connect(subGain);
      subGain.connect(this.ctx.destination);
      subOsc.start(now);
      subOsc.stop(now + 0.75);

      // 3. Wood grain resonance noise burst
      const bufferSize = this.ctx.sampleRate * 0.15;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(650, now);
      filter.Q.setValueAtTime(3.0, now);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.45, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      whiteNoise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      whiteNoise.start(now);
      whiteNoise.stop(now + 0.22);
    } catch (e) {
      console.warn('Audio impact unavailable:', e);
    }
  }

  // Play micro UI click/selection chime
  public playSubtleTick() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(780, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.04);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // ignore
    }
  }

  // Play shortlist success chime
  public playShortlistChime() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      [523.25, 659.25, 783.99].forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.06);
        gain.gain.setValueAtTime(0.18, now + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.4);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + i * 0.06);
        osc.stop(now + i * 0.06 + 0.45);
      });
    } catch {
      // ignore
    }
  }

  // Play dismiss/skip whoosh sound
  public playSkipTone() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.12);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.13);
    } catch {
      // ignore
    }
  }

  // Oral Argument Speech Narration & Waveform Feed
  public playOralArgument(
    lawyerId: string,
    transcript: string,
    onProgress: (currentTime: number, progressRatio: number) => void,
    onComplete: () => void
  ) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      onComplete();
      return;
    }

    // Stop existing speech
    this.stopSpeech();
    this.activeLawyerId = lawyerId;

    const utterance = new SpeechSynthesisUtterance(transcript);

    // Pick appropriate voice if available
    const voices = window.speechSynthesis.getVoices();
    // Default to natural English voices
    const preferredVoice = voices.find(v => 
      v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Premium') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel'))
    ) || voices.find(v => v.lang.startsWith('en'));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.rate = 0.95; // deliberate, professional courtroom cadence
    utterance.pitch = 0.98;

    const totalDurationSeconds = 15;
    let elapsedSeconds = 0;
    const intervalMs = 100;

    this.progressInterval = window.setInterval(() => {
      elapsedSeconds += intervalMs / 1000;
      const ratio = Math.min(1, elapsedSeconds / totalDurationSeconds);
      onProgress(elapsedSeconds, ratio);

      if (elapsedSeconds >= totalDurationSeconds) {
        this.stopSpeech();
        onComplete();
      }
    }, intervalMs);

    utterance.onend = () => {
      this.clearSpeechTracking();
      onComplete();
    };

    utterance.onerror = () => {
      this.clearSpeechTracking();
      onComplete();
    };

    window.speechSynthesis.speak(utterance);
  }

  public stopSpeech() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.clearSpeechTracking();
  }

  private clearSpeechTracking() {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
    this.activeLawyerId = null;
  }

  public isLawyerPlaying(lawyerId: string): boolean {
    return this.activeLawyerId === lawyerId;
  }
}

export const soundEngine = new SoundEngine();
