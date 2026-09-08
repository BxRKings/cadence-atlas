import { describe, expect, it } from "vitest";
import {
  analyzeProgression,
  buildChord,
  buildProgression,
  CHALLENGES,
  evaluateChallenge,
  keyLabel,
  recipeForMode,
  voiceLeadingDistance,
} from "../src/music";

describe("music theory engine", () => {
  it("builds diatonic major chords with MIDI pitches", () => {
    const tonic = buildChord(0, "major", 1);
    const dominant = buildChord(0, "major", 5);

    expect(tonic).toMatchObject({ roman: "I", name: "C", pitches: [48, 52, 55] });
    expect(dominant).toMatchObject({ roman: "V", name: "G", pitches: [55, 59, 62] });
  });

  it("uses a major dominant in minor for a decisive cadence", () => {
    const dominant = buildChord(9, "minor", 5);
    expect(dominant).toMatchObject({ roman: "V", name: "E", pitches: [64, 68, 71] });
  });

  it("recognizes an authentic cadence and useful harmonic arc", () => {
    const progression = buildProgression(0, "major", [2, 5, 1, 6, 4, 5, 1]);
    const analysis = analyzeProgression(progression);

    expect(analysis.cadence).toBe("Authentic cadence");
    expect(analysis.tensionPeak).toBeGreaterThanOrEqual(4);
    expect(analysis.score).toBeGreaterThanOrEqual(70);
  });

  it("offers an actionable suggestion for an unresolved loop", () => {
    const progression = buildProgression(0, "major", [1, 6, 4, 5]);
    const analysis = analyzeProgression(progression);

    expect(analysis.cadence).toBe("Half cadence");
    expect(analysis.suggestions.join(" ")).toContain("tonic");
  });

  it("keeps voice-leading and recipe selection deterministic", () => {
    const from = buildChord(0, "major", 1);
    const to = buildChord(0, "major", 6);

    expect(voiceLeadingDistance(from, to)).toBeLessThan(2);
    expect(recipeForMode("minor", 1).id).toBe("gravity");
    expect(keyLabel(3, "minor")).toBe("E♭ minor");
  });

  it("rejects invalid scale degrees", () => {
    expect(() => buildChord(0, "major", 8)).toThrow(RangeError);
  });

  it("scores the interactive harmony challenges from the actual progression", () => {
    const progression = buildProgression(0, "major", [2, 4, 5, 1]);
    expect(evaluateChallenge(CHALLENGES[0], progression)).toBe(true);
    expect(evaluateChallenge(CHALLENGES[1], progression)).toBe(true);
    expect(evaluateChallenge(CHALLENGES[2], progression)).toBe(true);
    expect(evaluateChallenge(CHALLENGES[3], progression)).toBe(true);
  });
});
