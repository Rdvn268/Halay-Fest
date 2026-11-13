import { describe, expect, it } from "vitest";
import {
  defaultSettings,
  mockInputSchema,
  settingsSchema,
} from "@halay/contracts";
import {
  applyEvent,
  applyControl,
  initialState,
  updateSettings,
} from "@halay/game-core";
import { MockSourceAdapter } from "../../services/live-gateway/src/source.js";

const source = new MockSourceAdapter();
const chat = (id: string, name = id) =>
  source.normalize({
    type: "chat",
    userId: id,
    displayName: name,
    message: " KATIL ".replace("I", "ı"),
  });
describe("shared models and demo game state", () => {
  it("preserves the required defaults and rejects invalid settings", () => {
    expect(initialState().settings).toEqual({
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
    expect(
      settingsSchema.safeParse({ ...defaultSettings, capacity: 101 }).success,
    ).toBe(false);
    expect(
      mockInputSchema.safeParse({
        type: "follow",
        userId: "a",
        displayName: "a",
        source: "tiktok_unofficial",
      }).success,
    ).toBe(false);
  });
  it("uses stable user identity and Turkish join text without mutating previous state", () => {
    const empty = initialState();
    const first = applyEvent(empty, chat("id-1", "Ad"));
    const second = applyEvent(first, chat("id-1", "Yeni Ad"));
    expect(empty.players).toHaveLength(0);
    expect(first.players).toHaveLength(1);
    expect(second.players).toHaveLength(1);
    expect(second.players[0]?.userId).toBe("id-1");
  });
  it("caps demo participants and rejects shrinking capacity below occupancy", () => {
    let state = updateSettings(initialState(), {
      ...defaultSettings,
      capacity: 2,
    });
    for (const id of ["a", "b", "c"]) state = applyEvent(state, chat(id));
    expect(state.players.map((p) => p.userId)).toEqual(["a", "b"]);
    expect(() =>
      updateSettings(state, { ...defaultSettings, capacity: 1 }),
    ).toThrow("Kapasite");
  });
  it("retains the free comment alternative when mock follow is selected", () => {
    let state = updateSettings(initialState(), {
      ...defaultSettings,
      joinMethod: "follow",
    });
    state = applyEvent(state, chat("free"));
    expect(state.players).toHaveLength(1);
  });
  it("applies controls and bounds the live recent-event view", () => {
    let state = initialState();
    for (let i = 0; i < 30; i++)
      state = applyEvent(
        state,
        source.normalize({ type: "like", userId: "a", displayName: "A" }),
      );
    expect(state.recentEvents).toHaveLength(20);
    state = applyControl(state, "pause");
    expect(state.paused).toBe(true);
    state = applyControl(state, "resume");
    expect(state.paused).toBe(false);
    state = applyControl(state, "new_round");
    expect(state.round).toBe(2);
    expect(state.tiktokStatus).toBe("unsupported");
  });
});
