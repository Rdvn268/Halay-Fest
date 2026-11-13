import { z } from "zod";

export const settingsSchema = z.strictObject({
  duration: z.number().int().min(5).max(60),
  npc: z.number().int().min(0).max(30),
  capacity: z.number().int().min(1).max(100),
  joinMethod: z.enum(["both", "comment", "follow"]),
  autoLoop: z.boolean(),
  autoCamera: z.boolean(),
  randomEvents: z.boolean(),
  musicMode: z.enum(["auto", "halay", "horon"]),
  musicVolume: z.number().int().min(0).max(100),
});
export type GameSettings = z.infer<typeof settingsSchema>;
export const defaultSettings: Readonly<GameSettings> = Object.freeze({
  duration: 20,
  npc: 6,
  capacity: 100,
  joinMethod: "both",
  autoLoop: true,
  autoCamera: true,
  randomEvents: true,
  musicMode: "auto",
  musicVolume: 45,
});
export const giftSchema = z.enum([
  "rose",
  "heart",
  "drum",
  "confetti",
  "crown",
  "fireworks",
]);
export type GiftKind = z.infer<typeof giftSchema>;
const identity = {
  eventId: z.string().min(1).max(128).optional(),
  userId: z.string().trim().min(1).max(64),
  displayName: z.string().trim().min(1).max(32),
};
export const mockInputSchema = z.discriminatedUnion("type", [
  z.strictObject({
    ...identity,
    type: z.literal("chat"),
    message: z.string().max(256),
  }),
  z.strictObject({ ...identity, type: z.literal("follow") }),
  z.strictObject({ ...identity, type: z.literal("gift"), gift: giftSchema }),
  z.strictObject({ ...identity, type: z.literal("like") }),
]);
export type MockInput = z.infer<typeof mockInputSchema>;
export const liveEventSchema = z.strictObject({
  eventId: z.string().min(1).max(128),
  source: z.enum(["mock", "replay", "tiktok_unofficial"]),
  roomId: z.string().min(1).max(128),
  sourceTimestamp: z.number().optional(),
  receivedAt: z.number().nonnegative(),
  type: z.enum([
    "chat",
    "follow",
    "gift",
    "like",
    "share",
    "viewer_join",
    "connection_state",
    "synthetic_test",
  ]),
  userId: z.string().optional(),
  displayName: z.string().optional(),
  payload: z.record(z.string(), z.unknown()),
});
export type LiveEvent = z.infer<typeof liveEventSchema>;
export const playerSchema = z.strictObject({
  userId: z.string(),
  displayName: z.string(),
  joinedAt: z.number(),
});
export type Player = z.infer<typeof playerSchema>;
export const snapshotSchema = z.strictObject({
  protocolVersion: z.literal(1),
  source: z.literal("mock"),
  tiktokStatus: z.literal("unsupported"),
  revision: z.number().int().nonnegative(),
  settings: settingsSchema,
  players: z.array(playerSchema).max(100),
  paused: z.boolean(),
  round: z.number().int().positive(),
  eventCount: z.number().int().nonnegative(),
  recentEvents: z.array(liveEventSchema).max(20),
});
export type GameSnapshot = z.infer<typeof snapshotSchema>;
export const serverMessageSchema = z.discriminatedUnion("kind", [
  z.strictObject({ kind: z.literal("snapshot"), snapshot: snapshotSchema }),
  z.strictObject({ kind: z.literal("event"), event: liveEventSchema }),
]);
export type ServerMessage = z.infer<typeof serverMessageSchema>;
export const controlSchema = z.strictObject({
  action: z.enum(["pause", "resume", "new_round", "clear_players"]),
});
export type ControlAction = z.infer<typeof controlSchema>["action"];
