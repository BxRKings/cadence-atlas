# Architecture

Cadence Atlas separates musical reasoning, local preview, file export, and remote project mutation so each claim can be tested independently.

## Data flow

1. `src/music.ts` converts a key, mode, and sequence of scale degrees into named triads and MIDI pitches.
2. The same module measures cadence, peak tension, unique harmonic colours, and symmetric pitch-class travel between adjacent triads.
3. `src/main.ts` renders that state as a seven-node harmonic map and handles the four constraint-based Resolution Run challenges.
4. `src/audio.ts` schedules a short local oscillator preview from the resulting pitches.
5. `src/midi.ts` encodes the progression as a dependency-free Standard MIDI File.
6. `src/nexus.ts` translates the identical chord objects into native Audiotool entities.

There is no hidden service, database, prompt, analytics endpoint, or server-side component.

## Musical model

The major and natural-minor scale intervals are explicit arrays. Each scale degree maps to a triad quality, Roman numeral, harmonic function, and tension value. Minor V is deliberately major to supply a raised leading tone and functional dominant.

Voice travel is the symmetric mean of the minimum pitch-class distance from every source chord tone to the target chord and back. It is a compact explanatory signal, not a claim of globally optimized voicing.

## Nexus transaction

The adapter queries the project inside the transaction lock. It reuses and updates a present `config`, preserves a present `mixerMaster`, and creates missing singletons only for an empty offline document. Track order is one higher than the largest current audio, automation, note, or pattern track.

Every export adds:

- one named Heisenberg synthesizer;
- one mixer channel and desktop audio cable;
- one note track, collection, and region;
- three notes per chord, one chord per four-four bar.

The transaction is atomic. If SDK validation rejects any pointer, field, or entity relationship, no partial graph is accepted.

## Trust boundaries

The offline proof uses `createOfflineDocument()` and never authenticates. The live path begins only from the explicit **Authorize and write** action. Audiotool handles OAuth PKCE; the app receives no password. The public client ID and project URL are kept in `sessionStorage` only so an OAuth redirect can resume in the same tab.

No token is logged, rendered, placed in a URL by this code, or written to the repository.
