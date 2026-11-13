import { randomUUID } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, readdir, stat, open, rename, rm } from "node:fs/promises";
import { extname, join } from "node:path";
import { Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { DatabaseSync } from "node:sqlite";
import { parseFile } from "music-metadata";
import {
  emptyLibrary,
  librarySchema,
  libraryPatchSchema,
  trackPatchSchema,
  transportCommandSchema,
  musicTelemetrySchema,
} from "@halay/contracts";
import type {
  MusicLibrary,
  MusicTrack,
  MusicTelemetry,
  ServerMessage,
  TransportCommand,
} from "@halay/contracts";

export const MAX_TRACK_BYTES = 64 * 1024 * 1024;
export const MAX_LIBRARY_BYTES = 1024 * 1024 * 1024;
export class MusicError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
/** Content-Length is only an early check. Every streamed chunk is budgeted. */
export class AudioBudget extends Transform {
  bytes = 0;
  constructor(
    private used: number,
    private limits = { track: MAX_TRACK_BYTES, total: MAX_LIBRARY_BYTES },
  ) {
    super();
  }
  override _transform(
    chunk: Buffer,
    _encoding: BufferEncoding,
    done: (error?: Error | null, data?: Buffer) => void,
  ) {
    this.bytes += chunk.length;
    if (
      this.bytes > this.limits.track ||
      this.used + this.bytes > this.limits.total
    )
      done(new MusicError(413, "Dosya veya toplam depolama sınırı aşıldı."));
    else done(null, chunk);
  }
}
export function audioFormat(header: Uint8Array): "wav" | "ogg" | "mp3" | null {
  const b = Buffer.from(header);
  if (
    b.length >= 12 &&
    b.toString("ascii", 0, 4) === "RIFF" &&
    b.toString("ascii", 8, 12) === "WAVE"
  )
    return "wav";
  if (b.length >= 4 && b.toString("ascii", 0, 4) === "OggS") return "ogg";
  if (b.length >= 3 && b.toString("ascii", 0, 3) === "ID3") return "mp3";
  if (b.length >= 2 && b[0] === 255 && ((b[1] ?? 0) & 0xe0) === 0xe0)
    return "mp3";
  return null;
}
const mime = { wav: "audio/wav", ogg: "audio/ogg", mp3: "audio/mpeg" } as const;
type JsonReader = (
  request: IncomingMessage,
  limit?: number,
) => Promise<unknown>;
export class MusicService {
  private state: MusicLibrary;
  private uploading = false;
  private telemetry: MusicTelemetry | undefined;
  private rateStart = Date.now();
  private writes = 0;
  private telemetryAt = 0;
  private mutationBusy = false;
  constructor(
    private db: DatabaseSync,
    private directory: string,
    private publish: (message: ServerMessage) => void,
  ) {
    const row = db.prepare("SELECT json FROM music_library WHERE id=1").get();
    this.state = row
      ? librarySchema.parse(JSON.parse(String(row["json"])))
      : emptyLibrary();
    // Persist the collection, never restart audible playback without a scene gesture.
    this.state.transport.playing = false;
  }
  get library(): MusicLibrary {
    return structuredClone(this.state);
  }
  private file(track: MusicTrack) {
    return join(this.directory, `${track.id}.${track.extension}`);
  }
  private commit(next: MusicLibrary) {
    next.revision = this.state.revision + 1;
    librarySchema.parse(next);
    this.db.exec("BEGIN IMMEDIATE");
    try {
      this.db
        .prepare(
          "INSERT INTO music_library VALUES(1,?) ON CONFLICT(id) DO UPDATE SET json=excluded.json",
        )
        .run(JSON.stringify(next));
      this.db.exec("DELETE FROM music_tracks");
      const insert = this.db.prepare("INSERT INTO music_tracks VALUES(?,?,?)");
      for (const track of next.tracks)
        insert.run(track.id, JSON.stringify(track), track.bytes);
      this.db.exec("COMMIT");
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
    this.state = next;
    this.publish({ kind: "music", library: this.library });
  }
  private async usedBytes() {
    await mkdir(this.directory, { recursive: true });
    let bytes = 0;
    for (const entry of await readdir(this.directory, {
      withFileTypes: true,
    })) {
      if (entry.isSymbolicLink())
        throw new MusicError(
          500,
          "Müzik klasöründe sembolik bağlantı desteklenmiyor.",
        );
      if (entry.isFile())
        bytes += (await stat(join(this.directory, entry.name))).size;
    }
    return bytes;
  }
  private async upload(request: IncomingMessage, filename: string) {
    if (this.uploading)
      throw new MusicError(
        409,
        "Bir yükleme sürüyor; tamamlanmasını bekleyin.",
      );
    if (this.state.tracks.length >= 200)
      throw new MusicError(413, "Kütüphane en fazla 200 parça tutar.");
    const extension = extname(filename).slice(1).toLowerCase();
    if (extension !== "mp3" && extension !== "wav" && extension !== "ogg")
      throw new MusicError(415, "Yalnızca MP3, WAV ve OGG kabul edilir.");
    const contentType = request.headers["content-type"]?.split(";")[0];
    if (
      ![
        mime[extension],
        "audio/x-wav",
        "application/ogg",
        "application/octet-stream",
      ].includes(contentType ?? "")
    )
      throw new MusicError(415, "Ses MIME türü desteklenmiyor.");
    const length = Number(request.headers["content-length"] ?? 0);
    if (length > MAX_TRACK_BYTES)
      throw new MusicError(413, "Tek dosya sınırı 64 MiB.");
    this.uploading = true;
    const id = randomUUID(),
      partial = join(this.directory, `${id}.part`),
      target = join(this.directory, `${id}.${extension}`);
    let moved = false;
    try {
      const used = await this.usedBytes();
      if (used + Math.max(length, 1) > MAX_LIBRARY_BYTES)
        throw new MusicError(413, "Yerel müzik depolama sınırı 1 GiB.");
      const limiter = new AudioBudget(used);
      await pipeline(
        request,
        limiter,
        createWriteStream(partial, { flags: "wx" }),
      );
      const bytes = limiter.bytes;
      if (bytes < 12) throw new MusicError(415, "Ses dosyası boş veya bozuk.");
      const handle = await open(partial, "r");
      let header: Buffer;
      try {
        header = Buffer.alloc(64);
        await handle.read(header, 0, 64, 0);
      } finally {
        await handle.close();
      }
      if (audioFormat(header) !== extension)
        throw new MusicError(415, "Dosya uzantısı ile ses imzası uyuşmuyor.");
      let duration: number | undefined;
      try {
        const metadata = await parseFile(partial, {
          duration: true,
          skipCovers: true,
        });
        duration = metadata.format.duration;
        if (
          !duration ||
          !Number.isFinite(duration) ||
          duration > 3600 ||
          !metadata.format.sampleRate
        )
          throw new Error("Invalid audio");
      } catch {
        throw new MusicError(
          415,
          "Ses konteyneri bozuk, süresi belirsiz veya bir saat sınırını aşıyor.",
        );
      }
      await rename(partial, target);
      moved = true;
      const title =
        filename
          .replace(/\.[^.]+$/, "")
          .replace(/[\x00-\x1f/\\]/g, " ")
          .trim()
          .slice(0, 120) || "İsimsiz parça";
      const track: MusicTrack = {
        id,
        title,
        extension,
        mime: mime[extension],
        bytes,
        createdAt: Date.now(),
        durationSec: duration,
        bpm: 120,
        bpmSource: "default",
        firstBeatSec: 0,
        beatsPerBar: 2,
        beatUnit: 4,
        calibrationMs: 0,
        dance: "halay",
        analysis: null,
        analysisVersion: 0,
      };
      const next = this.library;
      next.tracks.push(track);
      const playlist = next.playlists.find(
        (p) => p.id === next.activePlaylistId,
      )!;
      playlist.trackIds.push(id);
      if (!next.transport.trackId) next.transport.trackId = id;
      this.commit(next);
      return track;
    } catch (error) {
      await rm(moved ? target : partial, { force: true }).catch(
        () => undefined,
      );
      throw error;
    } finally {
      this.uploading = false;
    }
  }
  private command(command: TransportCommand) {
    const next = this.library;
    if (
      command.expectedSequence !== undefined &&
      command.expectedSequence !== next.transport.sequence
    )
      throw new MusicError(409, "Eski oynatma komutu reddedildi.");
    const ids = next.playlists.find(
      (p) => p.id === next.activePlaylistId,
    )!.trackIds;
    let id = command.trackId ?? next.transport.trackId;
    let playing = next.transport.playing;
    let position =
      command.positionSec ??
      (this.telemetry?.sequence === next.transport.sequence
        ? this.telemetry.mediaSeconds
        : next.transport.positionSec);
    if (
      command.action === "next" ||
      command.action === "previous" ||
      command.action === "ended"
    ) {
      if (command.action === "ended" && !next.autoplay) {
        playing = false;
        position = 0;
      } else {
        const index = id ? ids.indexOf(id) : -1;
        let target = index + (command.action === "previous" ? -1 : 1);
        if (target < 0) target = next.repeat ? ids.length - 1 : 0;
        if (target >= ids.length) {
          if (next.repeat) target = 0;
          else {
            target = Math.max(0, ids.length - 1);
            playing = false;
          }
        }
        id = ids[target] ?? null;
        position = 0;
      }
    } else if (command.action === "play") {
      id ??= ids[0] ?? null;
      playing = true;
      if (id !== next.transport.trackId) position = 0;
    } else if (command.action === "pause") playing = false;
    if (id && !next.tracks.some((t) => t.id === id))
      throw new MusicError(404, "Parça bulunamadı.");
    if (!id && playing)
      throw new MusicError(400, "Önce bir müzik dosyası ekleyin.");
    const duration = next.tracks.find((t) => t.id === id)?.durationSec;
    if (duration && position > duration)
      throw new MusicError(400, "Konum parça süresini aşamaz.");
    next.transport = {
      sequence: next.transport.sequence + 1,
      trackId: id,
      playing: id ? playing : false,
      positionSec: position,
      action: command.action,
    };
    this.commit(next);
  }
  private async audio(
    request: IncomingMessage,
    response: ServerResponse,
    id: string,
  ) {
    const track = this.state.tracks.find((t) => t.id === id);
    if (!track) throw new MusicError(404, "Parça bulunamadı.");
    let info;
    try {
      info = await stat(this.file(track));
    } catch {
      throw new MusicError(404, "Ses dosyası diskte bulunamadı.");
    }
    let start = 0,
      end = info.size - 1,
      status = 200;
    const range = request.headers.range;
    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (!match || (!match[1] && !match[2]))
        throw new MusicError(416, "Geçersiz ses byte aralığı.");
      if (!match[1]) start = Math.max(0, info.size - Number(match[2]));
      else {
        start = Number(match[1]);
        if (match[2]) end = Math.min(end, Number(match[2]));
      }
      if (
        !Number.isSafeInteger(start) ||
        start < 0 ||
        start > end ||
        start >= info.size
      ) {
        response.setHeader("Content-Range", `bytes */${info.size}`);
        throw new MusicError(416, "Ses byte aralığı dosya dışında.");
      }
      status = 206;
      response.setHeader("Content-Range", `bytes ${start}-${end}/${info.size}`);
    }
    response.writeHead(status, {
      "Content-Type": track.mime,
      "Accept-Ranges": "bytes",
      "Content-Length": end - start + 1,
    });
    if (request.method === "HEAD") {
      response.end();
      return;
    }
    const stream = createReadStream(this.file(track), {
      start,
      end,
      highWaterMark: 64 * 1024,
    });
    response.on("close", () => stream.destroy());
    stream.on("error", () => response.destroy());
    stream.pipe(response);
  }
  async handle(
    request: IncomingMessage,
    response: ServerResponse,
    readJson: JsonReader,
  ): Promise<boolean> {
    const url = new URL(request.url ?? "/", "http://127.0.0.1");
    if (!url.pathname.startsWith("/api/music")) return false;
    const reply = (status: number, data: unknown) =>
      response.writeHead(status).end(JSON.stringify(data));
    let ownsMutation = false;
    try {
      const audio = /^\/api\/music\/audio\/([a-f0-9-]{36})$/.exec(url.pathname);
      if (audio && ["GET", "HEAD"].includes(request.method ?? "")) {
        await this.audio(request, response, audio[1]!);
        return true;
      }
      if (request.method === "GET" && url.pathname === "/api/music") {
        reply(200, this.library);
        return true;
      }
      if (request.method === "GET" && url.pathname === "/api/music/telemetry") {
        reply(200, this.telemetry ?? null);
        return true;
      }
      if (request.method !== "POST")
        throw new MusicError(404, "Müzik yolu bulunamadı.");
      if (url.pathname === "/api/music/telemetry") {
        const telemetry = musicTelemetrySchema.parse(await readJson(request));
        if (Date.now() - this.telemetryAt < 250)
          throw new MusicError(429, "Telemetri çok sık.");
        if (
          telemetry.sequence !== this.state.transport.sequence ||
          telemetry.trackId !== this.state.transport.trackId
        )
          throw new MusicError(409, "Eski telemetri.");
        this.telemetryAt = Date.now();
        this.telemetry = telemetry;
        this.publish({ kind: "music_telemetry", telemetry });
        reply(200, { ok: true });
        return true;
      }
      if (Date.now() - this.rateStart > 60_000) {
        this.rateStart = Date.now();
        this.writes = 0;
      }
      if (++this.writes > 120)
        throw new MusicError(429, "Müzik işlem sınırı aşıldı.");
      if (this.mutationBusy)
        throw new MusicError(
          409,
          "Başka bir müzik işlemi sürüyor; tekrar deneyin.",
        );
      ownsMutation = true;
      this.mutationBusy = true;
      if (url.pathname === "/api/music/upload") {
        reply(
          201,
          await this.upload(request, url.searchParams.get("filename") ?? ""),
        );
        return true;
      }
      const body = await readJson(request, 256 * 1024);
      const trackRoute = /^\/api\/music\/tracks\/([a-f0-9-]{36})$/.exec(
        url.pathname,
      );
      if (trackRoute) {
        const next = this.library,
          index = next.tracks.findIndex((t) => t.id === trackRoute[1]);
        if (index < 0) throw new MusicError(404, "Parça bulunamadı.");
        const patch = trackPatchSchema.parse(body);
        Object.assign(next.tracks[index]!, patch);
        if (patch.analysis === null) next.tracks[index]!.analysisVersion++;
        if (
          next.tracks[index]!.durationSec &&
          next.tracks[index]!.firstBeatSec >= next.tracks[index]!.durationSec!
        )
          throw new MusicError(400, "İlk vuruş parça süresinden küçük olmalı.");
        this.commit(next);
        reply(200, next.tracks[index]);
      } else if (url.pathname === "/api/music/library") {
        const patch = libraryPatchSchema.parse(body);
        const valid = new Set(this.state.tracks.map((t) => t.id));
        if (
          new Set(patch.playlists.map((p) => p.id)).size !==
            patch.playlists.length ||
          !patch.playlists.some((p) => p.id === patch.activePlaylistId) ||
          patch.playlists.some(
            (p) =>
              p.trackIds.some((id) => !valid.has(id)) ||
              new Set(p.trackIds).size !== p.trackIds.length,
          )
        )
          throw new MusicError(400, "Liste veya parça referansı geçersiz.");
        this.commit({ ...this.library, ...patch });
        reply(200, this.library);
      } else if (url.pathname === "/api/music/transport") {
        const command = transportCommandSchema.parse(body);
        if (
          command.action === "ended" &&
          command.expectedSequence === undefined
        )
          throw new MusicError(
            400,
            "Bitiş komutu oynatma sürümünü gerektirir.",
          );
        this.command(command);
        reply(200, this.library);
      } else if (url.pathname === "/api/music/delete") {
        const id = (body as { id?: unknown })?.id;
        const next = this.library,
          track = next.tracks.find((t) => t.id === id);
        if (!track) throw new MusicError(404, "Parça bulunamadı.");
        const target = this.file(track),
          trash = target + ".delete";
        let moved = false;
        try {
          await rename(target, trash);
          moved = true;
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
        }
        next.tracks = next.tracks.filter((t) => t.id !== id);
        for (const playlist of next.playlists)
          playlist.trackIds = playlist.trackIds.filter(
            (trackId) => trackId !== id,
          );
        if (next.transport.trackId === id)
          next.transport = {
            sequence: next.transport.sequence + 1,
            trackId: null,
            playing: false,
            positionSec: 0,
            action: "pause",
          };
        try {
          this.commit(next);
        } catch (error) {
          if (moved) await rename(trash, target);
          throw error;
        }
        if (moved) await rm(trash);
        reply(200, { ok: true });
      } else throw new MusicError(404, "Müzik yolu bulunamadı.");
    } catch (error) {
      if (response.headersSent) {
        response.destroy();
        return true;
      }
      const status =
        error instanceof MusicError
          ? error.status
          : error instanceof Error &&
              (["ZodError", "SyntaxError"].includes(error.name) ||
                /JSON gerekli|İstek çok büyük/.test(error.message))
            ? 400
            : 500;
      reply(status, {
        error:
          error instanceof MusicError
            ? error.message
            : status === 400
              ? "Geçersiz müzik verisi."
              : "Yerel müzik depolama işlemi başarısız.",
      });
    } finally {
      if (ownsMutation) this.mutationBusy = false;
    }
    return true;
  }
}
