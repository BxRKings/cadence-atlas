# Cadence Atlas

**See where harmony wants to go.** Cadence Atlas turns a mood into a playable chord route, explains the harmonic pull, and writes the notes into an Audiotool project through the official open-source Nexus SDK.

This is an original entry candidate for Audiotool's global **Let's Build! 2026** competition. The event is free, runs through September 28, 2026, explicitly welcomes AI-assisted coding, and advertises six separate US$1,000 cash category prizes. A project is tagged by the judging panel for the categories it fits; entry does not guarantee a category, prize, or payment.

## Try it

The browser experience works without an account:

- choose any key and major or minor mode;
- start from one of six hand-authored harmonic routes;
- change any scale degree and see tension, cadence, diversity, and voice-leading update immediately;
- hear a short Web Audio preview;
- play four deterministic harmony challenges;
- download a standard type-0 MIDI file;
- build the route in an official, validated offline Nexus document and inspect the entity receipt.

The live Audiotool handoff requires a free Audiotool account, an OAuth application with `project:write`, and a project URL. The app asks only for the public client ID and project URL. Passwords and OAuth tokens stay with Audiotool.

## Why it fits the competition

Cadence Atlas is one coherent product with credible coverage across several published challenge categories:

- **Songstarter:** six mood-led starting routes turn a blank session into a first idea.
- **Composition:** the engine exposes scale degree, harmonic function, cadence, tension, and average voice travel.
- **Music Games:** Resolution Run evaluates four musical constraints against the route the player actually built.
- **Connect:** MIDI export and the Nexus adapter move the progression into another music workflow.
- **Education:** every suggestion is traceable to visible deterministic rules rather than an unexplained model response.

The organizer decides final category placement. This repository does not claim an award or special category eligibility.

## Nexus integration

`src/nexus.ts` creates or updates a complete project graph in one validated transaction:

```text
Config (tempo and duration)
└── default Groove

Heisenberg synth
├── DesktopAudioCable → MixerChannel → implicit master output
└── NoteTrack
    └── NoteRegion → NoteCollection
        └── 3 native Note entities per chord
```

The adapter preserves an existing project's `config` and `mixerMaster`, appends the next track order, creates a separate named synth and mixer channel, and writes one bar per chord. A four-chord route produces twelve native note entities.

The repository currently proves that graph against the official SDK's validated offline document. A live remote project write remains pending the personal Audiotool account and OAuth application setup; the interface labels that handoff separately.

## Local development

Requires Node.js 20 or newer.

```bash
npm install
npm run dev
```

Audiotool OAuth requires `127.0.0.1` rather than `localhost`. The development server is pinned accordingly at `http://127.0.0.1:5173/`.

Run all checks:

```bash
npm run check
```

Current verification:

- 11 focused tests pass across theory, challenge scoring, MIDI generation, and validated Nexus transactions;
- the production TypeScript/Vite build passes;
- headless Chromium checks pass at 1440 px and 390 px with zero console errors, page errors, or horizontal overflow;
- the browser's local Nexus receipt reports a successful validated transaction.

## Live Audiotool setup

1. Create or sign in to a personal Audiotool account.
2. Register an application at `https://developer.audiotool.com/applications`.
3. Use the exact URL shown in Cadence Atlas's **Send to Audiotool** dialog as the redirect URI.
4. Add the `project:write` scope.
5. Copy the public client ID and the URL of a disposable Audiotool project.
6. Open the dialog, review the current chord route, and authorize the write.

Use a disposable project for the first live check. Each accepted action appends a synth, mixer channel, note track, region, and notes.

## Transparency and limits

- All musical examples are generated from local deterministic rules; no external model or generated-audio API is used.
- The interface and code were created with AI assistance under Tyler's direction and are intended for human review before final competition submission.
- The project does not upload audio, contact other users, send messages, purchase anything, or expose credentials.
- Browser playback is a lightweight preview, not an attempt to reproduce Audiotool's instruments.
- Minor-mode V uses a raised leading tone to create a functional major dominant.
- The live OAuth/project-write path cannot be claimed as accepted until it is exercised with Tyler's Audiotool account.

See [ARCHITECTURE.md](ARCHITECTURE.md), [SECURITY.md](SECURITY.md), and [SUBMISSION.md](SUBMISSION.md) for review details.

## License

MIT. See [LICENSE](LICENSE). Audiotool and Nexus are names of their respective owners; this project is not an official Audiotool product.
