import { randomUUID } from "node:crypto";
import { mockInputSchema } from "@halay/contracts";
import type { LiveEvent } from "@halay/contracts";

export interface LiveSourceAdapter {
  readonly source: "mock" | "replay" | "tiktok_unofficial";
  normalize(input: unknown): LiveEvent;
}
export class MockSourceAdapter implements LiveSourceAdapter {
  readonly source = "mock";
  normalize(input: unknown): LiveEvent {
    const parsed = mockInputSchema.parse(input);
    const { eventId, userId, displayName, type, ...payload } = parsed;
    return {
      eventId: eventId ?? randomUUID(),
      source: this.source,
      roomId: "local-demo",
      receivedAt: Date.now(),
      type,
      userId,
      displayName,
      payload,
    };
  }
}
