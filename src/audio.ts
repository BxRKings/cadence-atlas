import type { Chord } from "./music";

let activeContext: AudioContext | null = null;

export async function playChords(chords: Chord[], bpm: number): Promise<void> {
  stopAudio();
  const context = new AudioContext();
  activeContext = context;
  const beatSeconds = 60 / bpm;
  const chordSeconds = beatSeconds * 1.15;

  chords.forEach((chord, chordIndex) => {
    const start = context.currentTime + 0.08 + chordIndex * chordSeconds;
    chord.pitches.forEach((pitch, noteIndex) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const filter = context.createBiquadFilter();
      oscillator.type = noteIndex === 0 ? "triangle" : "sine";
      oscillator.frequency.value = 440 * 2 ** ((pitch - 69) / 12);
      filter.type = "lowpass";
      filter.frequency.value = 1500;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.085 / (noteIndex + 1), start + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + chordSeconds * 0.86);
      oscillator.connect(filter).connect(gain).connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + chordSeconds * 0.9);
    });
  });

  const duration = (chords.length + 0.1) * chordSeconds * 1000;
  window.setTimeout(() => {
    if (activeContext === context) stopAudio();
  }, duration);
}

export function stopAudio(): void {
  if (!activeContext) return;
  void activeContext.close();
  activeContext = null;
}
