export type ScaleMode = "major" | "minor";

export interface Chord {
  degree: number;
  roman: string;
  name: string;
  root: number;
  pitches: number[];
  tension: number;
  function: "home" | "departure" | "motion" | "tension";
}

export interface ProgressionAnalysis {
  score: number;
  cadence: string;
  averageVoiceLeading: number;
  tensionPeak: number;
  uniqueChords: number;
  suggestions: string[];
}

export interface Recipe {
  id: string;
  name: string;
  mode: ScaleMode;
  degrees: number[];
  bpm: number;
  mood: string;
  description: string;
}

export interface HarmonyChallenge {
  id: "perfect-return" | "away-and-home" | "tension-arc" | "four-colours";
  title: string;
  prompt: string;
}

export const CHALLENGES: HarmonyChallenge[] = [
  {
    id: "perfect-return",
    title: "Perfect return",
    prompt: "Finish with V → I for an authentic cadence.",
  },
  {
    id: "away-and-home",
    title: "Find the way home",
    prompt: "Begin away from I, then make the final chord the tonic.",
  },
  {
    id: "tension-arc",
    title: "Touch the wire",
    prompt: "Reach tension 4 or higher and resolve on I.",
  },
  {
    id: "four-colours",
    title: "Four colours",
    prompt: "Use four distinct scale degrees in one progression.",
  },
];

export const PITCH_CLASSES = [
  "C",
  "C♯",
  "D",
  "E♭",
  "E",
  "F",
  "F♯",
  "G",
  "A♭",
  "A",
  "B♭",
  "B",
] as const;

export const RECIPES: Recipe[] = [
  {
    id: "golden-hour",
    name: "Golden Hour",
    mode: "major",
    degrees: [1, 5, 6, 4],
    bpm: 104,
    mood: "open",
    description: "A familiar lift with a soft landing and room for a vocal.",
  },
  {
    id: "second-wind",
    name: "Second Wind",
    mode: "major",
    degrees: [2, 5, 1, 6],
    bpm: 118,
    mood: "forward",
    description: "Motion through the dominant, then one last turn before home.",
  },
  {
    id: "wide-screen",
    name: "Wide Screen",
    mode: "major",
    degrees: [1, 3, 4, 5],
    bpm: 92,
    mood: "cinematic",
    description: "A patient climb that saves its strongest pull for the last bar.",
  },
  {
    id: "night-drive",
    name: "Night Drive",
    mode: "minor",
    degrees: [1, 6, 3, 7],
    bpm: 110,
    mood: "restless",
    description: "Dark without standing still, built around descending colour.",
  },
  {
    id: "gravity",
    name: "Gravity",
    mode: "minor",
    degrees: [1, 4, 6, 5],
    bpm: 86,
    mood: "tense",
    description: "A slow pull toward a bright dominant that demands another loop.",
  },
  {
    id: "after-rain",
    name: "After Rain",
    mode: "minor",
    degrees: [6, 7, 1, 4],
    bpm: 76,
    mood: "reflective",
    description: "Begins away from home and finds the tonic halfway through.",
  },
];

const SCALE_INTERVALS: Record<ScaleMode, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
};

const ROMAN: Record<ScaleMode, string[]> = {
  major: ["I", "ii", "iii", "IV", "V", "vi", "vii°"],
  minor: ["i", "ii°", "III", "iv", "V", "VI", "VII"],
};

const QUALITIES: Record<ScaleMode, Array<"major" | "minor" | "diminished">> = {
  major: ["major", "minor", "minor", "major", "major", "minor", "diminished"],
  minor: ["minor", "diminished", "major", "minor", "major", "major", "major"],
};

const TENSION: Record<ScaleMode, number[]> = {
  major: [0, 2, 2, 1, 4, 2, 5],
  minor: [0, 3, 2, 1, 5, 2, 3],
};

const FUNCTIONS: Array<Chord["function"]> = [
  "home",
  "motion",
  "motion",
  "departure",
  "tension",
  "departure",
  "tension",
];

function qualityIntervals(quality: "major" | "minor" | "diminished"): number[] {
  if (quality === "major") return [0, 4, 7];
  if (quality === "minor") return [0, 3, 7];
  return [0, 3, 6];
}

function qualitySuffix(quality: "major" | "minor" | "diminished"): string {
  if (quality === "major") return "";
  if (quality === "minor") return "m";
  return "dim";
}

export function buildChord(
  keyIndex: number,
  mode: ScaleMode,
  degree: number,
  octave = 3,
): Chord {
  if (!Number.isInteger(keyIndex) || keyIndex < 0 || keyIndex > 11) {
    throw new RangeError("keyIndex must be between 0 and 11");
  }
  if (!Number.isInteger(degree) || degree < 1 || degree > 7) {
    throw new RangeError("degree must be between 1 and 7");
  }

  const index = degree - 1;
  const root = 12 * (octave + 1) + keyIndex + SCALE_INTERVALS[mode][index];
  const quality = QUALITIES[mode][index];
  const rootName = PITCH_CLASSES[root % 12];

  return {
    degree,
    roman: ROMAN[mode][index],
    name: `${rootName}${qualitySuffix(quality)}`,
    root,
    pitches: qualityIntervals(quality).map((interval) => root + interval),
    tension: TENSION[mode][index],
    function: FUNCTIONS[index],
  };
}

export function buildProgression(
  keyIndex: number,
  mode: ScaleMode,
  degrees: number[],
): Chord[] {
  if (degrees.length < 2 || degrees.length > 8) {
    throw new RangeError("a progression must contain 2 to 8 chords");
  }
  return degrees.map((degree) => buildChord(keyIndex, mode, degree));
}

function pitchDistance(a: number, b: number): number {
  const difference = Math.abs((a % 12) - (b % 12));
  return Math.min(difference, 12 - difference);
}

export function voiceLeadingDistance(from: Chord, to: Chord): number {
  const forward = from.pitches.reduce(
    (total, pitch) => total + Math.min(...to.pitches.map((candidate) => pitchDistance(pitch, candidate))),
    0,
  );
  const backward = to.pitches.reduce(
    (total, pitch) => total + Math.min(...from.pitches.map((candidate) => pitchDistance(pitch, candidate))),
    0,
  );
  return (forward + backward) / (from.pitches.length + to.pitches.length);
}

export function analyzeProgression(chords: Chord[]): ProgressionAnalysis {
  if (chords.length < 2) throw new RangeError("analysis needs at least two chords");

  const final = chords.at(-1)!;
  const penultimate = chords.at(-2)!;
  const leadingDistances = chords
    .slice(1)
    .map((chord, index) => voiceLeadingDistance(chords[index], chord));
  const averageVoiceLeading =
    leadingDistances.reduce((total, value) => total + value, 0) / leadingDistances.length;
  const tensionPeak = Math.max(...chords.map((chord) => chord.tension));
  const uniqueChords = new Set(chords.map((chord) => chord.degree)).size;

  let score = 15;
  if (chords[0].degree === 1) score += 10;
  if (final.degree === 1) score += 20;
  if (penultimate.degree === 5 && final.degree === 1) score += 20;
  if (tensionPeak >= 4) score += 15;
  if (uniqueChords >= Math.min(3, chords.length)) score += 10;
  if (averageVoiceLeading <= 2) score += 10;

  const suggestions: string[] = [];
  if (final.degree !== 1) suggestions.push("Try landing on the tonic to make the loop feel complete.");
  if (!chords.some((chord) => chord.degree === 5)) {
    suggestions.push("Visit the dominant for a stronger pull toward home.");
  }
  if (uniqueChords < 3 && chords.length >= 3) {
    suggestions.push("Add one contrasting degree so the middle of the loop has a destination.");
  }
  if (averageVoiceLeading > 2.5) {
    suggestions.push("Use closer inversions when arranging these chords to reduce large jumps.");
  }
  if (suggestions.length === 0) {
    suggestions.push("The harmonic arc is clear; change rhythm or register before adding more chords.");
  }

  let cadence = "Open loop";
  if (penultimate.degree === 5 && final.degree === 1) cadence = "Authentic cadence";
  else if (penultimate.degree === 4 && final.degree === 1) cadence = "Plagal cadence";
  else if (final.degree === 5) cadence = "Half cadence";
  else if (final.degree === 1) cadence = "Tonic arrival";

  return {
    score: Math.min(100, score),
    cadence,
    averageVoiceLeading: Number(averageVoiceLeading.toFixed(2)),
    tensionPeak,
    uniqueChords,
    suggestions,
  };
}

export function evaluateChallenge(challenge: HarmonyChallenge, chords: Chord[]): boolean {
  if (chords.length < 2) return false;
  const final = chords.at(-1)!;
  const penultimate = chords.at(-2)!;
  switch (challenge.id) {
    case "perfect-return":
      return penultimate.degree === 5 && final.degree === 1;
    case "away-and-home":
      return chords[0].degree !== 1 && final.degree === 1;
    case "tension-arc":
      return Math.max(...chords.map((chord) => chord.tension)) >= 4 && final.degree === 1;
    case "four-colours":
      return new Set(chords.map((chord) => chord.degree).values()).size >= 4;
  }
}

export function recipeForMode(mode: ScaleMode, index = 0): Recipe {
  const matches = RECIPES.filter((recipe) => recipe.mode === mode);
  return matches[((index % matches.length) + matches.length) % matches.length];
}

export function keyLabel(keyIndex: number, mode: ScaleMode): string {
  return `${PITCH_CLASSES[keyIndex]} ${mode}`;
}
