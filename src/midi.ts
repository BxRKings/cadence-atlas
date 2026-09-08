import type { Chord } from "./music";

function variableLength(value: number): number[] {
  let buffer = value & 0x7f;
  const bytes: number[] = [];
  while ((value >>= 7)) {
    buffer <<= 8;
    buffer |= (value & 0x7f) | 0x80;
  }
  while (true) {
    bytes.push(buffer & 0xff);
    if (buffer & 0x80) buffer >>= 8;
    else break;
  }
  return bytes;
}

function textBytes(text: string): number[] {
  return [...new TextEncoder().encode(text)];
}

function uint32(value: number): number[] {
  return [(value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff];
}

export function progressionToMidi(chords: Chord[], bpm: number): Uint8Array {
  if (chords.length === 0) throw new RangeError("MIDI export needs at least one chord");
  if (!Number.isFinite(bpm) || bpm < 30 || bpm > 300) {
    throw new RangeError("bpm must be between 30 and 300");
  }

  const division = 480;
  const barTicks = division * 4;
  const soundingTicks = barTicks - 120;
  const microseconds = Math.round(60_000_000 / bpm);
  const name = textBytes("Cadence Atlas progression");
  const track: number[] = [
    0x00,
    0xff,
    0x03,
    name.length,
    ...name,
    0x00,
    0xff,
    0x51,
    0x03,
    (microseconds >>> 16) & 0xff,
    (microseconds >>> 8) & 0xff,
    microseconds & 0xff,
    0x00,
    0xc0,
    0x04,
  ];

  chords.forEach((chord, chordIndex) => {
    const gap = chordIndex === 0 ? 0 : barTicks - soundingTicks;
    chord.pitches.forEach((pitch, noteIndex) => {
      track.push(...variableLength(noteIndex === 0 ? gap : 0), 0x90, pitch, 92);
    });
    chord.pitches.forEach((pitch, noteIndex) => {
      track.push(...variableLength(noteIndex === 0 ? soundingTicks : 0), 0x80, pitch, 0);
    });
  });

  track.push(0x00, 0xff, 0x2f, 0x00);

  return new Uint8Array([
    ...textBytes("MThd"),
    ...uint32(6),
    0x00,
    0x00,
    0x00,
    0x01,
    (division >>> 8) & 0xff,
    division & 0xff,
    ...textBytes("MTrk"),
    ...uint32(track.length),
    ...track,
  ]);
}
