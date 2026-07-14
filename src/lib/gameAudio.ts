let context: AudioContext | null = null;
let musicTimer: number | null = null;
let noteIndex = 0;

const melody = [261.6, 329.6, 392, 329.6, 293.7, 349.2, 440, 349.2];

function audioContext() {
  context ??= new AudioContext();
  if (context.state === 'suspended') void context.resume();
  return context;
}

function playNote(frequency: number, duration = .22, volume = .035) {
  const audio = audioContext();
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.type = 'triangle';
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(volume, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + duration);
  oscillator.connect(gain).connect(audio.destination);
  oscillator.start();
  oscillator.stop(audio.currentTime + duration);
}

export function startGameMusic() {
  if (musicTimer !== null) return;
  playNote(melody[noteIndex]);
  musicTimer = window.setInterval(() => {
    noteIndex = (noteIndex + 1) % melody.length;
    playNote(melody[noteIndex]);
    if (noteIndex % 2 === 0) playNote(melody[noteIndex] / 2, .3, .018);
  }, 330);
}

export function stopGameMusic() {
  if (musicTimer !== null) window.clearInterval(musicTimer);
  musicTimer = null;
}

const phrases = ['Банана!', 'Папой!', 'Тулали лу!', 'Белло!', 'Пуэда!', 'Танка ю!'];

export function playMinionVoice() {
  const voice = new SpeechSynthesisUtterance(phrases[Math.floor(Math.random() * phrases.length)]);
  voice.lang = 'ru-RU';
  voice.pitch = 1.8;
  voice.rate = 1.35;
  voice.volume = .55;
  window.speechSynthesis.speak(voice);
}
