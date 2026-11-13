import { defaultSettings, settingsSchema } from "@halay/contracts";
import type {
  GameSettings,
  GameSnapshot,
  LiveEvent,
  ControlAction,
} from "@halay/contracts";

export function initialState(
  settings: GameSettings = { ...defaultSettings },
): GameSnapshot {
  return {
    protocolVersion: 1,
    source: "mock",
    tiktokStatus: "unsupported",
    revision: 0,
    settings: settingsSchema.parse(settings),
    players: [],
    paused: false,
    round: 1,
    eventCount: 0,
    recentEvents: [],
  };
}

/** Minimal demo routing. Full rules, streak accounting and FIFO belong to later phases. */
export function applyEvent(
  state: GameSnapshot,
  event: LiveEvent,
): GameSnapshot {
  const players = [...state.players];
  const joins =
    (event.type === "chat" &&
      typeof event.payload["message"] === "string" &&
      event.payload["message"].trim().toLocaleLowerCase("tr-TR") === "katıl") ||
    (event.type === "follow" && state.settings.joinMethod !== "comment");
  if (
    joins &&
    event.userId &&
    !players.some((p) => p.userId === event.userId) &&
    players.length < state.settings.capacity
  ) {
    players.push({
      userId: event.userId,
      displayName: event.displayName ?? event.userId,
      joinedAt: event.receivedAt,
    });
  }
  return {
    ...state,
    players,
    revision: state.revision + 1,
    eventCount: state.eventCount + 1,
    recentEvents: [event, ...state.recentEvents].slice(0, 20),
  };
}
export function updateSettings(
  state: GameSnapshot,
  input: unknown,
): GameSnapshot {
  const settings = settingsSchema.parse(input);
  if (settings.capacity < state.players.length)
    throw new Error("Kapasite mevcut oyuncu sayısından küçük olamaz.");
  return { ...state, settings, revision: state.revision + 1 };
}
export function applyControl(
  state: GameSnapshot,
  action: ControlAction,
): GameSnapshot {
  return {
    ...state,
    revision: state.revision + 1,
    paused:
      action === "pause" ? true : action === "resume" ? false : state.paused,
    round: action === "new_round" ? state.round + 1 : state.round,
    players: action === "clear_players" ? [] : state.players,
  };
}
