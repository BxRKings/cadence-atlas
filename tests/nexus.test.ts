import { createOfflineDocument } from "@audiotool/nexus/node";
import { describe, expect, it } from "vitest";
import { buildProgression } from "../src/music";
import { writeProgressionToNexus } from "../src/nexus";

describe("Audiotool Nexus integration", () => {
  it("writes a validated, playable four-bar project graph", async () => {
    const document = await createOfflineDocument();
    const summary = await writeProgressionToNexus(
      document,
      buildProgression(0, "major", [1, 5, 6, 4]),
      104,
    );

    expect(summary).toMatchObject({ notes: 12, chords: 4, bars: 4, bpm: 104 });
    expect(summary.entityCounts).toMatchObject({
      heisenberg: 1,
      mixerChannel: 1,
      desktopAudioCable: 1,
      noteTrack: 1,
      noteRegion: 1,
      noteCollection: 1,
      note: 12,
    });
    expect(document.queryEntities.ofTypes("config").get()).toHaveLength(1);
    expect(document.queryEntities.ofTypes("mixerMaster").get()).toHaveLength(1);
  });

  it("appends a second progression without duplicating project singletons", async () => {
    const document = await createOfflineDocument();
    const progression = buildProgression(9, "minor", [1, 6, 3, 7]);

    await writeProgressionToNexus(document, progression, 86);
    await writeProgressionToNexus(document, progression, 96);

    expect(document.queryEntities.ofTypes("config").get()).toHaveLength(1);
    expect(document.queryEntities.ofTypes("mixerMaster").get()).toHaveLength(1);
    expect(document.queryEntities.ofTypes("noteTrack").get()).toHaveLength(2);
    expect(document.queryEntities.ofTypes("note").get()).toHaveLength(24);
  });
});
