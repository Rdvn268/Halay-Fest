import { mkdtemp, rm, readdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { once } from "node:events";
import { afterEach, expect, it } from "vitest";
import { createGateway } from "../../services/live-gateway/src/server.js";
import { recordedBeatWav } from "../helpers/audio.js";
import type { MusicLibrary, MusicTrack } from "@halay/contracts";
import { request as httpRequest } from "node:http";
import { Readable, Writable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { setTimeout as delay } from "node:timers/promises";
import {
  AudioBudget,
  MAX_TRACK_BYTES,
} from "../../services/live-gateway/src/music-service.js";
let root: string;
let gateway: ReturnType<typeof createGateway> | undefined;
async function start(existing?: string) {
  root = existing ?? (await mkdtemp(join(tmpdir(), "halay-music-")));
  gateway = createGateway({
    databasePath: join(root, "test.sqlite"),
    musicDirectory: join(root, "music"),
    allowedOrigins: [],
  });
  gateway.server.listen(0, "127.0.0.1");
  await once(gateway.server, "listening");
  const address = gateway.server.address();
  if (!address || typeof address === "string") throw new Error("No server");
  return `http://127.0.0.1:${address.port}`;
}
afterEach(async () => {
  await gateway?.close();
  gateway = undefined;
  if (root) await rm(root, { recursive: true, force: true });
});
const post = (url: string, body: unknown) =>
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
const upload = (url: string, name: string, data: Buffer = recordedBeatWav()) =>
  fetch(`${url}/api/music/upload?filename=${encodeURIComponent(name)}`, {
    method: "POST",
    headers: {
      "Content-Type": name.endsWith(".mp3") ? "audio/mpeg" : "audio/wav",
    },
    body: new Uint8Array(data),
  });
it("streams/validates audio, supports byte ranges and restores metadata/playlists after restart", async () => {
  let url = await start();
  const response = await upload(url, "Own recording.wav");
  expect(response.status).toBe(201);
  const track = (await response.json()) as MusicTrack;
  expect(track.durationSec).toBeCloseTo(8);
  expect(track.bpmSource).toBe("default");
  const bytes = await readFile(join(root, "music", `${track.id}.wav`));
  expect(bytes).toEqual(recordedBeatWav());
  const range = await fetch(`${url}/api/music/audio/${track.id}`, {
    headers: { Range: "bytes=0-43" },
  });
  expect(range.status).toBe(206);
  expect(Buffer.from(await range.arrayBuffer())).toEqual(bytes.subarray(0, 44));
  expect(
    (
      await fetch(`${url}/api/music/audio/${track.id}`, {
        headers: { Range: "bytes=999999999-" },
      })
    ).status,
  ).toBe(416);
  expect(
    (
      await post(`${url}/api/music/tracks/${track.id}`, {
        bpm: 108,
        bpmSource: "manual",
        dance: "horon",
        beatsPerBar: 7,
        beatUnit: 8,
      })
    ).status,
  ).toBe(200);
  const library = (await (
    await fetch(`${url}/api/music`)
  ).json()) as MusicLibrary;
  const playlists = [
    ...library.playlists,
    { id: "second", name: "Horon gecesi", trackIds: [track.id] },
  ];
  expect(
    (
      await post(`${url}/api/music/library`, {
        playlists,
        activePlaylistId: "second",
        autoplay: true,
        repeat: true,
      })
    ).status,
  ).toBe(200);
  await gateway!.close();
  gateway = undefined;
  url = await start(root);
  const restored = (await (
    await fetch(`${url}/api/music`)
  ).json()) as MusicLibrary;
  expect(restored.activePlaylistId).toBe("second");
  expect(restored.tracks[0]).toMatchObject({ bpm: 108, dance: "horon" });
  expect(restored.transport.playing).toBe(false);
  expect(
    Buffer.from(
      await (await fetch(`${url}/api/music/audio/${track.id}`)).arrayBuffer(),
    ),
  ).toEqual(recordedBeatWav());
});
it("rejects oversized Content-Length before accepting audio", async () => {
  const url = await start();
  const status = await new Promise<number>((resolve, reject) => {
    const req = httpRequest(
      `${url}/api/music/upload?filename=large.wav`,
      {
        method: "POST",
        headers: {
          "Content-Type": "audio/wav",
          "Content-Length": MAX_TRACK_BYTES + 1,
        },
      },
      (res) => {
        res.resume();
        resolve(res.statusCode!);
      },
    );
    req.on("error", reject);
    req.end();
  });
  expect(status).toBe(413);
  expect(
    ((await (await fetch(`${url}/api/music`)).json()) as MusicLibrary).tracks,
  ).toHaveLength(0);
});
it("bounds chunked streams by both per-file and total budgets without buffering the file", async () => {
  for (const [used, limits, chunks, forwarded] of [
    [0, { track: 6, total: 100 }, [4, 4], 4],
    [5, { track: 100, total: 10 }, [2, 2, 2], 4],
  ] as const) {
    let bytes = 0;
    const sink = new Writable({
      write(chunk: Buffer, _encoding, done) {
        bytes += chunk.length;
        done();
      },
    });
    await expect(
      pipeline(
        Readable.from(chunks.map((n) => Buffer.alloc(n))),
        new AudioBudget(used, limits),
        sink,
      ),
    ).rejects.toMatchObject({ status: 413 });
    expect(bytes).toBe(forwarded);
  }
  let bytes = 0;
  await pipeline(
    Readable.from([Buffer.alloc(6)]),
    new AudioBudget(4, { track: 6, total: 10 }),
    new Writable({
      write(chunk: Buffer, _encoding, done) {
        bytes += chunk.length;
        done();
      },
    }),
  );
  expect(bytes).toBe(6);
});
it("rolls back disk and metadata when the SQLite commit fails", async () => {
  const url = await start();
  const reject = () =>
    gateway!.store.db.exec(
      "CREATE TRIGGER injected_music_failure BEFORE INSERT ON music_library BEGIN SELECT RAISE(ABORT,'Injected storage failure'); END",
    );
  reject();
  expect((await upload(url, "rollback.wav")).status).toBe(500);
  expect(await readdir(join(root, "music"))).toEqual([]);
  expect(
    ((await (await fetch(`${url}/api/music`)).json()) as MusicLibrary).tracks,
  ).toHaveLength(0);
  gateway!.store.db.exec("DROP TRIGGER injected_music_failure");
  const track = (await (
    await upload(url, "rollback.wav")
  ).json()) as MusicTrack;
  reject();
  expect((await post(`${url}/api/music/delete`, { id: track.id })).status).toBe(
    500,
  );
  expect(await readFile(join(root, "music", `${track.id}.wav`))).toEqual(
    recordedBeatWav(),
  );
  expect(
    ((await (await fetch(`${url}/api/music`)).json()) as MusicLibrary).tracks,
  ).toHaveLength(1);
});
it("serializes an in-progress upload against other library mutations", async () => {
  const url = await start(),
    data = recordedBeatWav();
  let req: ReturnType<typeof httpRequest> | undefined;
  try {
    const complete = new Promise<number>((resolve, reject) => {
      req = httpRequest(
        `${url}/api/music/upload?filename=slow.wav`,
        { method: "POST", headers: { "Content-Type": "audio/wav" } },
        (res) => {
          res.resume();
          resolve(res.statusCode!);
        },
      );
      req.on("error", reject);
      req.write(data.subarray(0, 64));
    });
    let partial = false;
    for (let i = 0; i < 50; i++) {
      partial = (await readdir(join(root, "music")).catch(() => [])).some(
        (name) => name.endsWith(".part"),
      );
      if (partial) break;
      await delay(10);
    }
    expect(partial).toBe(true);
    expect(
      (await post(`${url}/api/music/transport`, { action: "pause" })).status,
    ).toBe(409);
    req!.end(data.subarray(64));
    expect(await complete).toBe(201);
  } finally {
    req?.destroy();
  }
});
it("validates metadata/list references and honors autoplay/repeat switches", async () => {
  const url = await start();
  const track = (await (await upload(url, "one.wav")).json()) as MusicTrack;
  expect(
    (await post(`${url}/api/music/tracks/${track.id}`, { bpm: 0 })).status,
  ).toBe(400);
  expect(
    (await post(`${url}/api/music/tracks/${track.id}`, { firstBeatSec: 9 }))
      .status,
  ).toBe(400);
  expect(
    (
      await fetch(`${url}/api/music/tracks/${track.id}`, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: "bad",
      })
    ).status,
  ).toBe(400);
  let state = (await (await fetch(`${url}/api/music`)).json()) as MusicLibrary;
  const config = {
    playlists: state.playlists,
    activePlaylistId: state.activePlaylistId,
    autoplay: false,
    repeat: false,
  };
  expect(
    (
      await post(`${url}/api/music/library`, {
        ...config,
        activePlaylistId: "missing",
      })
    ).status,
  ).toBe(400);
  await post(`${url}/api/music/library`, config);
  await post(`${url}/api/music/transport`, {
    action: "play",
    trackId: track.id,
  });
  state = (await (await fetch(`${url}/api/music`)).json()) as MusicLibrary;
  await post(`${url}/api/music/transport`, {
    action: "ended",
    expectedSequence: state.transport.sequence,
  });
  state = (await (await fetch(`${url}/api/music`)).json()) as MusicLibrary;
  expect(state.transport.playing).toBe(false);
  expect(state.transport.trackId).toBe(track.id);
  await post(`${url}/api/music/library`, { ...config, autoplay: true });
  await post(`${url}/api/music/transport`, { action: "play" });
  state = (await (await fetch(`${url}/api/music`)).json()) as MusicLibrary;
  await post(`${url}/api/music/transport`, {
    action: "ended",
    expectedSequence: state.transport.sequence,
  });
  expect(
    ((await (await fetch(`${url}/api/music`)).json()) as MusicLibrary).transport
      .playing,
  ).toBe(false);
});
it("rejects spoofed/empty containers and leaves no partial files", async () => {
  const url = await start();
  expect((await upload(url, "fake.mp3")).status).toBe(415);
  expect((await upload(url, "empty.wav", Buffer.alloc(0))).status).toBe(415);
  expect(
    (
      await upload(
        url,
        "not-audio.wav",
        Buffer.from("RIFF0000WAVE invalid content"),
      )
    ).status,
  ).toBe(415);
  expect(await readdir(join(root, "music"))).toEqual([]);
});
it("shows disk errors instead of reporting a successful upload", async () => {
  const url = await start();
  await writeFile(join(root, "music"), "not a directory");
  expect((await upload(url, "track.wav")).status).toBe(500);
  expect(
    ((await (await fetch(`${url}/api/music`)).json()) as MusicLibrary).tracks,
  ).toHaveLength(0);
});
it("advances automatically, rejects duplicate ended commands, orders and deletes tracks safely", async () => {
  const url = await start();
  const first = (await (await upload(url, "first.wav")).json()) as MusicTrack;
  const second = (await (await upload(url, "second.wav")).json()) as MusicTrack;
  await post(`${url}/api/music/transport`, {
    action: "play",
    trackId: first.id,
  });
  let library = (await (
    await fetch(`${url}/api/music`)
  ).json()) as MusicLibrary;
  const sequence = library.transport.sequence;
  expect(
    (
      await post(`${url}/api/music/transport`, {
        action: "ended",
        expectedSequence: sequence,
      })
    ).status,
  ).toBe(200);
  expect(
    (
      await post(`${url}/api/music/transport`, {
        action: "ended",
        expectedSequence: sequence,
      })
    ).status,
  ).toBe(409);
  library = (await (await fetch(`${url}/api/music`)).json()) as MusicLibrary;
  expect(library.transport.trackId).toBe(second.id);
  expect(library.transport.playing).toBe(true);
  await post(`${url}/api/music/delete`, { id: second.id });
  library = (await (await fetch(`${url}/api/music`)).json()) as MusicLibrary;
  expect(library.tracks.map((t) => t.id)).toEqual([first.id]);
  expect(library.playlists[0]?.trackIds).toEqual([first.id]);
  expect(library.transport.playing).toBe(false);
  expect(await readdir(join(root, "music"))).toEqual([`${first.id}.wav`]);
});
