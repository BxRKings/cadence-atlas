import "./styles.css";
import { playChords, stopAudio } from "./audio";
import { progressionToMidi } from "./midi";
import {
  analyzeProgression,
  buildProgression,
  CHALLENGES,
  evaluateChallenge,
  keyLabel,
  PITCH_CLASSES,
  RECIPES,
  recipeForMode,
  type Chord,
  type ScaleMode,
} from "./music";
import { connectAndWrite, verifyOfflineWrite } from "./nexus";

interface AppState {
  keyIndex: number;
  mode: ScaleMode;
  degrees: number[];
  bpm: number;
  recipeId: string | null;
  routeName: string;
  challengeIndex: number;
  playing: boolean;
}

function element<T extends HTMLElement>(selector: string): T {
  const match = document.querySelector<T>(selector);
  if (!match) throw new Error(`Missing element: ${selector}`);
  return match;
}

const initialRecipe = recipeForMode("major");
const state: AppState = {
  keyIndex: 0,
  mode: "major",
  degrees: [...initialRecipe.degrees],
  bpm: initialRecipe.bpm,
  recipeId: initialRecipe.id,
  routeName: initialRecipe.name,
  challengeIndex: 0,
  playing: false,
};

const keySelect = element<HTMLSelectElement>("#keySelect");
const bpmInput = element<HTMLInputElement>("#bpmInput");
const bpmOutput = element<HTMLOutputElement>("#bpmOutput");
const recipeList = element<HTMLDivElement>("#recipeList");
const routeTitle = element<HTMLHeadingElement>("#routeTitle");
const scoreDial = element<HTMLDivElement>("#scoreDial");
const scoreValue = element<HTMLElement>("#scoreValue");
const atlas = element<HTMLDivElement>("#atlas");
const chordStrip = element<HTMLDivElement>("#chordStrip");
const analysisGrid = element<HTMLDivElement>("#analysisGrid");
const challengeTitle = element<HTMLHeadingElement>("#challengeTitle");
const challengePrompt = element<HTMLParagraphElement>("#challengePrompt");
const challengeResult = element<HTMLDivElement>("#challengeResult");
const playButton = element<HTMLButtonElement>("#playButton");
const sdkState = element<HTMLSpanElement>("#sdkState");
const receipt = element<HTMLDivElement>(".entity-receipt");
const receiptStatus = element<HTMLSpanElement>("#receiptStatus");
const receiptOutput = element<HTMLPreElement>("#receiptOutput");
const nexusDialog = element<HTMLDialogElement>("#nexusDialog");
const clientIdInput = element<HTMLInputElement>("#clientIdInput");
const projectUrlInput = element<HTMLInputElement>("#projectUrlInput");
const dialogStatus = element<HTMLParagraphElement>("#dialogStatus");

PITCH_CLASSES.forEach((pitch, index) => {
  const option = document.createElement("option");
  option.value = String(index);
  option.textContent = pitch;
  keySelect.append(option);
});

const mapPositions = [
  { x: 350, y: 286 },
  { x: 148, y: 238 },
  { x: 112, y: 112 },
  { x: 263, y: 62 },
  { x: 478, y: 63 },
  { x: 606, y: 154 },
  { x: 548, y: 270 },
];

const roleLabels = ["HOME", "MOTION", "MOTION", "AWAY", "PULL", "COLOUR", "EDGE"];
const chordColours = ["#7ce9ba", "#9c8cff", "#c8a5ff", "#68c8ff", "#ff7657", "#f4bd6d", "#ff8fb5"];

function currentChords(): Chord[] {
  return buildProgression(state.keyIndex, state.mode, state.degrees);
}

function routeMap(chords: Chord[]): string {
  const baseOrder = [1, 4, 7, 3, 6, 2, 5, 1];
  const basePath = baseOrder
    .map((degree, index) => {
      const point = mapPositions[degree - 1];
      return `${index === 0 ? "M" : "L"}${point.x},${point.y}`;
    })
    .join(" ");

  const segments = chords.slice(1).map((chord, index) => {
    const from = mapPositions[chords[index].degree - 1];
    const to = mapPositions[chord.degree - 1];
    const midpointX = (from.x + to.x) / 2;
    const midpointY = (from.y + to.y) / 2;
    const sameNode = from.x === to.x && from.y === to.y;
    const path = sameNode
      ? `M${from.x - 12},${from.y - 24} C${from.x - 54},${from.y - 72} ${from.x + 54},${from.y - 72} ${from.x + 12},${from.y - 24}`
      : `M${from.x},${from.y} Q${midpointX},${midpointY - 18} ${to.x},${to.y}`;
    return `<path class="map-path" d="${path}" marker-end="url(#routeArrow)" />`;
  });

  const activeDegrees = new Set(chords.map((chord) => chord.degree));
  const nodes = mapPositions.map((point, index) => {
    const degree = index + 1;
    const classes = ["map-node", degree === 1 ? "home" : "", activeDegrees.has(degree) ? "active" : ""]
      .filter(Boolean)
      .join(" ");
    const chord = buildProgression(state.keyIndex, state.mode, [degree, 1])[0];
    return `<g class="${classes}" transform="translate(${point.x} ${point.y})">
      <circle r="29"></circle>
      <text y="-3">${chord.roman}</text>
      <text class="node-role" y="14">${roleLabels[index]}</text>
    </g>`;
  });

  const orderLabels = chords.map((chord, index) => {
    const point = mapPositions[chord.degree - 1];
    const offset = (index % 3) * 12 - 12;
    return `<g transform="translate(${point.x + 28 + offset} ${point.y - 27})">
      <circle r="9" fill="#090c14" stroke="#ff7657"></circle>
      <text class="map-order" text-anchor="middle" dominant-baseline="middle">${index + 1}</text>
    </g>`;
  });

  return `<svg viewBox="0 0 700 350" role="img" aria-label="The current progression moving across seven scale degrees">
    <defs>
      <marker id="routeArrow" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
        <path d="M0,0 L7,3.5 L0,7 Z" fill="#ff7657"></path>
      </marker>
    </defs>
    <path class="map-base" d="${basePath}"></path>
    ${segments.join("")}
    ${nodes.join("")}
    ${orderLabels.join("")}
  </svg>`;
}

function renderRecipes(): void {
  recipeList.innerHTML = RECIPES.filter((recipe) => recipe.mode === state.mode)
    .map(
      (recipe) => `<button class="recipe-card ${recipe.id === state.recipeId ? "active" : ""}" type="button" data-recipe="${recipe.id}">
        <strong>${recipe.name}</strong><small>${recipe.mood}</small><span>${recipe.degrees.join(" · ")}</span>
      </button>`,
    )
    .join("");
}

function render(): void {
  const chords = currentChords();
  const analysis = analyzeProgression(chords);
  const challenge = CHALLENGES[state.challengeIndex];
  const passed = evaluateChallenge(challenge, chords);

  keySelect.value = String(state.keyIndex);
  bpmInput.value = String(state.bpm);
  bpmOutput.value = `${state.bpm} BPM`;
  routeTitle.textContent = `${keyLabel(state.keyIndex, state.mode)} · ${state.routeName}`;
  element<HTMLElement>("#heroBars").textContent = String(chords.length);
  scoreValue.textContent = String(analysis.score);
  scoreDial.style.background = `conic-gradient(var(--mint) ${analysis.score}%, rgba(124,233,186,.06) 0)`;
  atlas.innerHTML = routeMap(chords);
  chordStrip.style.setProperty("--chord-count", String(Math.min(chords.length, 8)));
  chordStrip.innerHTML = chords
    .map(
      (chord, index) => `<article class="chord-card" style="--card-color:${chordColours[chord.degree - 1]}">
        <span class="bar-index">BAR ${String(index + 1).padStart(2, "0")}</span>
        <div class="chord-controls" aria-label="Change bar ${index + 1} chord">
          <button type="button" data-chord="${index}" data-delta="-1" aria-label="Previous scale degree">−</button>
          <button type="button" data-chord="${index}" data-delta="1" aria-label="Next scale degree">+</button>
        </div>
        <strong>${chord.roman}</strong>
        <small>${chord.name} · ${chord.function}</small>
        <div class="tension-meter" aria-label="Tension ${chord.tension} out of 5">
          ${[1, 2, 3, 4, 5].map((level) => `<i class="${level <= chord.tension ? "on" : ""}"></i>`).join("")}
        </div>
      </article>`,
    )
    .join("");

  analysisGrid.innerHTML = `
    <div class="analysis-card"><span>Cadence</span><strong>${analysis.cadence}</strong></div>
    <div class="analysis-card"><span>Peak tension</span><strong>${analysis.tensionPeak} / 5</strong></div>
    <div class="analysis-card"><span>Voice travel</span><strong>${analysis.averageVoiceLeading}</strong></div>
    <div class="analysis-card"><span>Colours</span><strong>${analysis.uniqueChords}</strong></div>
    <div class="analysis-card wide"><span>Coach</span><strong>${analysis.suggestions[0]}</strong></div>
    <div class="analysis-card wide"><span>Route</span><strong>${chords.map((chord) => chord.roman).join(" → ")}</strong></div>`;

  challengeTitle.textContent = challenge.title;
  challengePrompt.textContent = challenge.prompt;
  challengeResult.classList.toggle("pass", passed);
  challengeResult.innerHTML = `<span>Current route</span><strong>${passed ? "Challenge cleared" : "Keep shaping"}</strong>`;
  document.querySelectorAll<HTMLButtonElement>("[data-mode]").forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === state.mode);
  });
  playButton.innerHTML = state.playing ? "<span aria-hidden='true'>■</span> Stop preview" : "<span aria-hidden='true'>▶</span> Play the route";
  renderRecipes();
}

function chooseRecipe(recipeId: string): void {
  const recipe = RECIPES.find((candidate) => candidate.id === recipeId);
  if (!recipe) return;
  state.mode = recipe.mode;
  state.degrees = [...recipe.degrees];
  state.bpm = recipe.bpm;
  state.recipeId = recipe.id;
  state.routeName = recipe.name;
  render();
}

function shuffleRoute(): void {
  const next = Array.from({ length: state.degrees.length }, () => Math.floor(Math.random() * 7) + 1);
  next[Math.floor(next.length / 2)] = 5;
  if (Math.random() > 0.35) next[next.length - 1] = 1;
  state.degrees = next;
  state.recipeId = null;
  state.routeName = "Custom route";
  render();
}

async function runNexusProof(): Promise<void> {
  receipt.classList.remove("ready", "error");
  receiptStatus.textContent = "BUILDING";
  receiptOutput.textContent = "Creating validated offline document…";
  sdkState.className = "sdk-state";
  sdkState.innerHTML = "<i></i> Nexus transaction running";
  try {
    const summary = await verifyOfflineWrite(currentChords(), state.bpm);
    const entities = Object.entries(summary.entityCounts)
      .map(([name, count]) => `  ${name.padEnd(20)} ${count}`)
      .join("\n");
    receiptOutput.textContent = `validated              true\ntempo                 ${summary.bpm} BPM\nbars                   ${summary.bars}\nchord tones            ${summary.notes}\n\nentities\n${entities}\n\nresult                 transaction accepted`;
    receiptStatus.textContent = "PASSED";
    receipt.classList.add("ready");
    sdkState.className = "sdk-state ready";
    sdkState.innerHTML = "<i></i> Nexus proof passed";
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    receiptOutput.textContent = `Validation failed\n\n${message}`;
    receiptStatus.textContent = "FAILED";
    receipt.classList.add("error");
    sdkState.className = "sdk-state error";
    sdkState.innerHTML = "<i></i> Nexus proof failed";
  }
}

function downloadMidi(): void {
  const bytes = progressionToMidi(currentChords(), state.bpm);
  const blob = new Blob([Uint8Array.from(bytes).buffer], { type: "audio/midi" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const key = PITCH_CLASSES[state.keyIndex].replace("♯", "sharp").replace("♭", "flat");
  anchor.href = url;
  anchor.download = `cadence-atlas-${key}-${state.mode}.mid`;
  anchor.click();
  URL.revokeObjectURL(url);
}

keySelect.addEventListener("change", () => {
  state.keyIndex = Number(keySelect.value);
  render();
});

bpmInput.addEventListener("input", () => {
  state.bpm = Number(bpmInput.value);
  state.recipeId = null;
  state.routeName = "Custom route";
  render();
});

document.querySelectorAll<HTMLButtonElement>("[data-mode]").forEach((button) => {
  button.addEventListener("click", () => {
    const mode = button.dataset.mode as ScaleMode;
    const recipe = recipeForMode(mode);
    state.mode = mode;
    chooseRecipe(recipe.id);
  });
});

recipeList.addEventListener("click", (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-recipe]");
  if (button?.dataset.recipe) chooseRecipe(button.dataset.recipe);
});

chordStrip.addEventListener("click", (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-chord]");
  if (!button) return;
  const index = Number(button.dataset.chord);
  const delta = Number(button.dataset.delta);
  state.degrees[index] = ((state.degrees[index] - 1 + delta + 7) % 7) + 1;
  state.recipeId = null;
  state.routeName = "Custom route";
  render();
});

element<HTMLButtonElement>("#addChord").addEventListener("click", () => {
  if (state.degrees.length >= 8) return;
  state.degrees.push(state.degrees.at(-1) === 5 ? 1 : 5);
  state.recipeId = null;
  state.routeName = "Custom route";
  render();
});

element<HTMLButtonElement>("#removeChord").addEventListener("click", () => {
  if (state.degrees.length <= 2) return;
  state.degrees.pop();
  state.recipeId = null;
  state.routeName = "Custom route";
  render();
});

playButton.addEventListener("click", async () => {
  if (state.playing) {
    stopAudio();
    state.playing = false;
    render();
    return;
  }
  state.playing = true;
  render();
  await playChords(currentChords(), state.bpm);
  window.setTimeout(() => {
    state.playing = false;
    render();
  }, currentChords().length * (60 / state.bpm) * 1.15 * 1000 + 250);
});

element<HTMLButtonElement>("#shuffleButton").addEventListener("click", shuffleRoute);
element<HTMLButtonElement>("#nextChallenge").addEventListener("click", () => {
  state.challengeIndex = (state.challengeIndex + 1) % CHALLENGES.length;
  render();
});
element<HTMLButtonElement>("#downloadMidi").addEventListener("click", downloadMidi);
element<HTMLButtonElement>("#validateNexus").addEventListener("click", () => void runNexusProof());

const redirectUrl = new URL(".", window.location.href).toString().split("?")[0].split("#")[0];
element<HTMLElement>("#redirectValue").textContent = redirectUrl;
clientIdInput.value = sessionStorage.getItem("cadence-atlas-client-id") ?? "";
projectUrlInput.value = sessionStorage.getItem("cadence-atlas-project-url") ?? "";

element<HTMLButtonElement>("#openNexus").addEventListener("click", () => nexusDialog.showModal());
element<HTMLButtonElement>("#writeLive").addEventListener("click", async () => {
  const clientId = clientIdInput.value.trim();
  const projectUrl = projectUrlInput.value.trim();
  dialogStatus.className = "dialog-status";
  if (!clientId || !projectUrl) {
    dialogStatus.classList.add("error");
    dialogStatus.textContent = "Both the public client ID and project URL are required.";
    return;
  }
  if (!projectUrl.startsWith("https://beta.audiotool.com/")) {
    dialogStatus.classList.add("error");
    dialogStatus.textContent = "Use a project URL copied from beta.audiotool.com.";
    return;
  }
  sessionStorage.setItem("cadence-atlas-client-id", clientId);
  sessionStorage.setItem("cadence-atlas-project-url", projectUrl);
  dialogStatus.textContent = "Opening Audiotool OAuth and preparing the validated transaction…";
  try {
    const result = await connectAndWrite(clientId, redirectUrl, projectUrl, currentChords(), state.bpm);
    if (result.status === "written") {
      dialogStatus.classList.add("success");
      dialogStatus.textContent = `Written: ${result.summary.notes} notes across ${result.summary.bars} bars.`;
      await runNexusProof();
    }
  } catch (error) {
    dialogStatus.classList.add("error");
    dialogStatus.textContent = error instanceof Error ? error.message : String(error);
  }
});

render();
void runNexusProof();
