let context: AudioContext | null = null;
let musicTimer: number | null = null;
let step = 0;

const melody = [659, 784, 880, 784, 659, 587, 659, 523, 659, 784, 988, 880, 784, 659, 587, 659];
const chords = [[262, 330, 392], [220, 262, 330], [175, 220, 262], [196, 247, 294]];

function audioContext() {
  context ??= new AudioContext();
  if (context.state === 'suspended') void context.resume();
  return context;
}

function tone(frequency: number, duration: number, volume: number, type: OscillatorType = 'triangle') {
  const audio = audioContext();
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, audio.currentTime);
  gain.gain.setValueAtTime(.001, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(volume, audio.currentTime + .025);
  gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + duration);
  oscillator.connect(gain).connect(audio.destination);
  oscillator.start();
  oscillator.stop(audio.currentTime + duration);
}

function drum(strong: boolean) {
  const audio = audioContext();
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(strong ? 115 : 170, audio.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(48, audio.currentTime + .1);
  gain.gain.setValueAtTime(strong ? .07 : .035, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + .13);
  oscillator.connect(gain).connect(audio.destination);
  oscillator.start();
  oscillator.stop(audio.currentTime + .14);
}

function playMusicStep() {
  tone(melody[step % melody.length], .18, .025, 'triangle');
  if (step % 2 === 0) drum(step % 4 === 0);
  if (step % 4 === 0) {
    const chord = chords[Math.floor(step / 4) % chords.length];
    chord.forEach((note) => tone(note, .7, .009, 'sine'));
    tone(chord[0] / 2, .32, .028, 'square');
  }
  step = (step + 1) % 64;
}

export function startGameMusic() {
  if (musicTimer !== null) return;
  playMusicStep();
  musicTimer = window.setInterval(playMusicStep, 230);
}

export function stopGameMusic() {
  if (musicTimer !== null) window.clearInterval(musicTimer);
  musicTimer = null;
  step = 0;
}
