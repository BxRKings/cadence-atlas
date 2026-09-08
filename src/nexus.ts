import {
  audiotool,
  createOfflineDocument,
  type OfflineDocument,
  type SyncedDocument,
} from "@audiotool/nexus";
import { Ticks } from "@audiotool/nexus/utils";
import type { Chord } from "./music";

type WritableDocument = Pick<OfflineDocument, "modify" | "queryEntities">;

export interface NexusWriteSummary {
  notes: number;
  chords: number;
  bars: number;
  bpm: number;
  entityCounts: Record<string, number>;
}

export async function writeProgressionToNexus(
  document: WritableDocument,
  chords: Chord[],
  bpm: number,
): Promise<NexusWriteSummary> {
  if (chords.length < 2) throw new RangeError("Nexus export needs at least two chords");
  const durationTicks = Ticks.Bars(chords.length);

  await document.modify((transaction) => {
    const config = transaction.entities.ofTypes("config").getOne();
    let defaultGroove = transaction.entities.ofTypes("groove").getOne();
    if (!defaultGroove) {
      defaultGroove = transaction.create("groove", {
        displayName: "Cadence Atlas — straight",
        impact: 0,
      });
    }
    if (config) {
      transaction.update(config.fields.tempoBpm, bpm);
      if (config.fields.durationTicks.value < durationTicks) {
        transaction.update(config.fields.durationTicks, durationTicks);
      }
    } else {
      transaction.create("config", {
        tempoBpm: bpm,
        durationTicks,
        defaultGroove: defaultGroove.location,
      });
    }

    if (!transaction.entities.ofTypes("mixerMaster").getOne()) {
      transaction.create("mixerMaster", {
        positionX: 520,
        positionY: 40,
        limiterEnabled: true,
      });
    }

    const existingTracks = transaction.entities
      .ofTypes("audioTrack", "automationTrack", "noteTrack", "patternTrack")
      .get();
    const nextOrder =
      existingTracks.reduce(
        (largest, track) => Math.max(largest, Number(track.fields.orderAmongTracks.value)),
        -1,
      ) + 1;
    const synth = transaction.create("heisenberg", {
      displayName: "Cadence Atlas chords",
      positionX: 80,
      positionY: 40,
      gain: 0.58,
      playModeIndex: 4,
      unisonoCount: 2,
      unisonoDetuneSemitones: 0.02,
      unisonoStereoSpreadFactor: 0.65,
    });
    const mixerChannel = transaction.create("mixerChannel", {});
    transaction.create("desktopAudioCable", {
      fromSocket: synth.fields.audioOutput.location,
      toSocket: mixerChannel.fields.audioInput.location,
      colorIndex: 31,
    });
    const track = transaction.create("noteTrack", {
      orderAmongTracks: nextOrder,
      player: synth.location,
    });
    const collection = transaction.create("noteCollection", {});
    transaction.create("noteRegion", {
      track: track.location,
      collection: collection.location,
      region: {
        positionTicks: 0,
        durationTicks,
        loopDurationTicks: durationTicks,
        displayName: "Cadence Atlas progression",
        colorIndex: 31,
      },
    });

    chords.forEach((chord, chordIndex) => {
      chord.pitches.forEach((pitch, noteIndex) => {
        transaction.create("note", {
          collection: collection.location,
          positionTicks: Ticks.Bars(chordIndex),
          durationTicks: Ticks.Bars(1) - Ticks.Beat / 8,
          pitch,
          velocity: 0.72 - noteIndex * 0.04,
        });
      });
    });
  });

  const entityCounts = Object.fromEntries(
    [
      "heisenberg",
      "mixerChannel",
      "desktopAudioCable",
      "noteTrack",
      "noteRegion",
      "noteCollection",
      "note",
    ].map((type) => [type, document.queryEntities.ofTypes(type as "note").get().length]),
  );

  return {
    notes: chords.reduce((total, chord) => total + chord.pitches.length, 0),
    chords: chords.length,
    bars: chords.length,
    bpm,
    entityCounts,
  };
}

export async function verifyOfflineWrite(chords: Chord[], bpm: number): Promise<NexusWriteSummary> {
  const document = await createOfflineDocument();
  return writeProgressionToNexus(document, chords, bpm);
}

export async function connectAndWrite(
  clientId: string,
  redirectUrl: string,
  projectUrl: string,
  chords: Chord[],
  bpm: number,
): Promise<{ status: "redirecting" } | { status: "written"; summary: NexusWriteSummary }> {
  const auth = await audiotool({
    clientId,
    redirectUrl,
    scope: "project:write",
  });
  if (auth.status === "unauthenticated") {
    auth.login();
    return { status: "redirecting" };
  }

  const document: SyncedDocument = await auth.open(projectUrl);
  await document.start();
  try {
    const summary = await writeProgressionToNexus(document, chords, bpm);
    return { status: "written", summary };
  } finally {
    await document.stop();
  }
}
