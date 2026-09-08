# Submission draft

## Project

**Cadence Atlas**

**Tagline:** Turn harmonic tension into a map you can play, understand, and send to Audiotool.

## What it does

Cadence Atlas is a visual harmony instrument for the moment before a song exists. Pick a key, mode, and mood-led starting route. The map shows how each scale degree moves between home, departure, motion, and tension. Change any chord and the cadence, tension peak, harmonic diversity, voice travel, and coaching update immediately.

Press play for a lightweight browser preview, download a standard MIDI file, or send the route into Audiotool. The Nexus integration creates a Heisenberg synth, mixer channel, audio cable, note track, region, collection, and every chord tone as native editable entities. Resolution Run adds four small composition challenges that are scored from the player's real progression.

## Published challenge fit

- Songstarter: mood-led routes from blank page to first progression.
- Composition: visible harmony analysis and intentional route editing.
- Music Games: four constraint-based Resolution Run challenges.
- Connect: native Nexus project writing and MIDI export.
- Education: traceable scale-degree, cadence, function, tension, and voice-leading explanations.

The judging panel determines the final category or categories.

## How it was built

The application is TypeScript and browser-native HTML/CSS. Its musical engine is deterministic. It uses the official `@audiotool/nexus` 0.0.17 SDK for both validated offline documents and the OAuth-backed live project transaction. MIDI generation is dependency-free, and local sound uses Web Audio oscillators.

The interface and implementation were created with AI-assisted coding under Tyler's direction. No external model runs inside the product and no generated audio is submitted as original human performance.

## Validation

- 11 focused tests pass.
- Official Nexus validation accepts the complete generated entity graph.
- TypeScript and Vite production build pass.
- Desktop and mobile browser runs have zero console errors, page errors, or horizontal overflow.
- MIDI export is covered by header, track, and range tests.

## Current honest limit

The official offline SDK path is fully tested. The remote OAuth write needs Tyler's personal Audiotool account, registered client ID, and disposable project before the final submission. Until that is exercised, the repository does not claim a successful live server write.

## What comes next

After the live check, record a short demonstration that starts with Golden Hour, edits it into an authentic cadence, clears Resolution Run, downloads the MIDI, and shows the resulting native note region in Audiotool. Then add inversions and rhythmic pattern choices without hiding the underlying theory.
