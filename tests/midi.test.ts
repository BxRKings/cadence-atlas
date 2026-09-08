import { describe, expect, it } from "vitest";
import { progressionToMidi } from "../src/midi";
import { buildProgression } from "../src/music";

describe("MIDI export", () => {
  it("creates a valid type-0 MIDI file with one track", () => {
    const midi = progressionToMidi(buildProgression(0, "major", [1, 5, 6, 4]), 104);
    const text = new TextDecoder().decode(midi);

    expect(text.slice(0, 4)).toBe("MThd");
    expect(text).toContain("MTrk");
    expect(midi[8]).toBe(0);
    expect(midi[9]).toBe(0);
    expect(midi.length).toBeGreaterThan(100);
  });

  it("rejects tempos outside the supported range", () => {
    const chords = buildProgression(0, "major", [1, 5]);
    expect(() => progressionToMidi(chords, 10)).toThrow(RangeError);
  });
});
