import { z } from "zod";

export const danceSchema = z.enum(["halay", "horon", "govend", "zeybek"]);
export type DanceStyle = z.infer<typeof danceSchema>;
export const analysisSchema = z.strictObject({
  bpm: z.number().min(40).max(240),
  confidence: z.number().min(0).max(1),
  firstBeatSec: z.number().min(0).max(3600),
  onsetCount: z.number().int().min(3).max(10000),
  observedSeconds: z.number().min(0).max(120),
  regularity: z.number().min(0).max(1),
  meterCandidates: z
    .array(
      z.strictObject({
        beats: z.number().int().min(2).max(9),
        confidence: z.number().min(0).max(1),
      }),
    )
    .max(4),
});
export type RhythmAnalysis = z.infer<typeof analysisSchema>;
export const trackPatchSchema = z.strictObject({
  title: z.string().trim().min(1).max(120).optional(),
  bpm: z.number().min(40).max(240).optional(),
  bpmSource: z.enum(["default", "manual", "analysis"]).optional(),
  firstBeatSec: z.number().min(0).max(3600).optional(),
  beatsPerBar: z
    .number()
    .int()
    .refine((n) => [2, 3, 4, 7, 9].includes(n))
    .optional(),
  beatUnit: z.union([z.literal(4), z.literal(8)]).optional(),
  calibrationMs: z.number().min(-500).max(500).optional(),
  dance: danceSchema.optional(),
  analysis: analysisSchema.nullable().optional(),
});
export const trackSchema = z.strictObject({
  id: z.uuid(),
  title: z.string().min(1).max(120),
  extension: z.enum(["mp3", "wav", "ogg"]),
  mime: z.enum(["audio/mpeg", "audio/wav", "audio/ogg"]),
  bytes: z.number().int().positive(),
  createdAt: z.number(),
  durationSec: z.number().nullable(),
  bpm: z.number().min(40).max(240),
  bpmSource: z.enum(["default", "manual", "analysis"]),
  firstBeatSec: z.number().min(0),
  beatsPerBar: z.number().int().min(2).max(9),
  beatUnit: z.union([z.literal(4), z.literal(8)]),
  calibrationMs: z.number(),
  dance: danceSchema,
  analysis: analysisSchema.nullable(),
  analysisVersion: z.number().int().nonnegative(),
});
export type MusicTrack = z.infer<typeof trackSchema>;
export const playlistSchema = z.strictObject({
  id: z.string().min(1).max(64),
  name: z.string().trim().min(1).max(80),
  trackIds: z.array(z.uuid()).max(200),
});
export const libraryPatchSchema = z.strictObject({
  playlists: z.array(playlistSchema).min(1).max(20),
  activePlaylistId: z.string().min(1).max(64),
  autoplay: z.boolean(),
  repeat: z.boolean(),
});
export const transportSchema = z.strictObject({
  sequence: z.number().int().nonnegative(),
  trackId: z.uuid().nullable(),
  playing: z.boolean(),
  positionSec: z.number().nonnegative(),
  action: z.enum(["play", "pause", "next", "previous", "seek", "ended"]),
});
export const librarySchema = z.strictObject({
  ...libraryPatchSchema.shape,
  revision: z.number().int().nonnegative(),
  tracks: z.array(trackSchema).max(200),
  transport: transportSchema,
});
export type MusicLibrary = z.infer<typeof librarySchema>;
export const transportCommandSchema = z.strictObject({
  action: z.enum(["play", "pause", "next", "previous", "seek", "ended"]),
  trackId: z.uuid().optional(),
  positionSec: z.number().min(0).max(3600).optional(),
  expectedSequence: z.number().int().nonnegative().optional(),
});
export type TransportCommand = z.infer<typeof transportCommandSchema>;
export const musicTelemetrySchema = z.strictObject({
  clientId: z.uuid(),
  sequence: z.number().int().nonnegative(),
  trackId: z.uuid().nullable(),
  mediaSeconds: z.number().min(0).max(7200),
  durationSec: z.number().min(0).max(7200),
  playing: z.boolean(),
  unlocked: z.boolean(),
  error: z.string().max(250).nullable(),
  bpm: z.number().min(40).max(240),
  beat: z.number(),
  bar: z.number().int(),
  driftP95Ms: z.number().nonnegative(),
  onsetErrorP95Ms: z.number().nonnegative().nullable(),
  onsetSamples: z.number().int().nonnegative(),
  fps: z.number().min(0).max(1000),
  frameP95Ms: z.number().nonnegative(),
  heapMB: z.number().nonnegative().nullable(),
  characters: z.number().int().min(0).max(130),
  rigs: z.number().int().min(0).max(130),
  drawCalls: z.number().int().nonnegative(),
  triangles: z.number().int().nonnegative(),
  clip: z.string().max(80),
  handGapMeters: z.number().nonnegative(),
  analysisSeconds: z.number().nonnegative(),
});
export type MusicTelemetry = z.infer<typeof musicTelemetrySchema>;
export const emptyLibrary = (): MusicLibrary => ({
  revision: 0,
  tracks: [],
  playlists: [{ id: "festival", name: "Şenlik listesi", trackIds: [] }],
  activePlaylistId: "festival",
  autoplay: true,
  repeat: true,
  transport: {
    sequence: 0,
    trackId: null,
    playing: false,
    positionSec: 0,
    action: "pause",
  },
});
