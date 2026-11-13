import { once } from "node:events";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { WebSocket } from "ws";
import { afterEach, expect, it } from "vitest";
import { defaultSettings, serverMessageSchema } from "@halay/contracts";
import { createGateway } from "../../services/live-gateway/src/server.js";
import { LocalStore } from "../../services/live-gateway/src/database.js";
import { MockSourceAdapter } from "../../services/live-gateway/src/source.js";

let gateway: ReturnType<typeof createGateway> | undefined;
let temp: string | undefined;
afterEach(async () => {
  await gateway?.close();
  gateway = undefined;
  if (temp) await rm(temp, { recursive: true, force: true });
  temp = undefined;
});
async function start(path = ":memory:") {
  gateway = createGateway({
    databasePath: path,
    allowedOrigins: ["http://127.0.0.1:5174"],
  });
  gateway.server.listen(0, "127.0.0.1");
  await once(gateway.server, "listening");
  const address = gateway.server.address();
  if (!address || typeof address === "string")
    throw new Error("No TCP address");
  return `http://127.0.0.1:${address.port}`;
}
const post = (url: string, body: unknown, origin?: string) =>
  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(origin ? { Origin: origin } : {}),
    },
    body: JSON.stringify(body),
  });
it("sends validated mock events over a real socket, suppressing duplicate event IDs", async () => {
  const url = await start();
  const socket = new WebSocket(url.replace("http:", "ws:") + "/ws", {
    origin: "http://127.0.0.1:5174",
  });
  const initial = once(socket, "message");
  await once(socket, "open");
  const [raw] = await initial;
  expect(serverMessageSchema.parse(JSON.parse(String(raw))).kind).toBe(
    "snapshot",
  );
  const messages: unknown[] = [];
  socket.on("message", (raw) => messages.push(JSON.parse(String(raw))));
  const input = {
    type: "chat",
    userId: "id-1",
    displayName: "Türkçe 🎵",
    message: "katıl",
    eventId: "same-id",
  };
  expect((await post(url + "/api/mock", input)).status).toBe(200);
  await expect.poll(() => messages.length).toBe(2);
  expect(serverMessageSchema.parse(messages[0])).toMatchObject({
    kind: "snapshot",
    snapshot: { source: "mock", players: [{ userId: "id-1" }] },
  });
  expect(await (await post(url + "/api/mock", input)).json()).toMatchObject({
    accepted: false,
    reason: "duplicate",
  });
  expect(gateway?.getState().eventCount).toBe(1);
  socket.close();
});
it("rejects untrusted origins, malformed payloads and oversized input without changing the game", async () => {
  const url = await start();
  const good = { type: "follow", userId: "a", displayName: "A" };
  expect(
    (await post(url + "/api/mock", good, "https://untrusted.invalid")).status,
  ).toBe(403);
  expect(
    (await post(url + "/api/mock", { ...good, source: "tiktok_unofficial" }))
      .status,
  ).toBe(400);
  expect(
    (
      await post(url + "/api/mock", {
        ...good,
        displayName: "a".repeat(20_000),
      })
    ).status,
  ).toBe(400);
  expect(
    (await post(url + "/api/settings", { ...defaultSettings, capacity: 101 }))
      .status,
  ).toBe(400);
  expect(gateway?.getState().eventCount).toBe(0);
});
it("migrates SQLite once and restores saved settings on reopening", async () => {
  temp = await mkdtemp(join(tmpdir(), "halay-db-"));
  const path = join(temp, "settings.sqlite");
  let url = await start(path);
  expect(
    (
      await post(url + "/api/settings", {
        ...defaultSettings,
        musicMode: "horon",
        musicVolume: 25,
      })
    ).status,
  ).toBe(200);
  await gateway!.close();
  gateway = undefined;
  url = await start(path);
  expect(await (await fetch(url + "/api/state")).json()).toMatchObject({
    settings: { musicMode: "horon", musicVolume: 25 },
  });
  expect(
    gateway!.store.db
      .prepare("SELECT COUNT(*) AS n FROM schema_migrations")
      .get()?.["n"],
  ).toBe(1);
});
it("bounds mock event storage and keeps a repeated event from being applied twice", () => {
  const store = new LocalStore(":memory:");
  const source = new MockSourceAdapter();
  try {
    for (let i = 0; i < 1005; i++)
      store.record(
        source.normalize({
          type: "like",
          userId: "a",
          displayName: "A",
          eventId: String(i),
        }),
      );
    expect(
      store.db.prepare("SELECT COUNT(*) AS n FROM event_inbox").get()?.["n"],
    ).toBe(1000);
    expect(
      store.record(
        source.normalize({
          type: "like",
          userId: "a",
          displayName: "A",
          eventId: "1004",
        }),
      ),
    ).toBe(false);
  } finally {
    store.close();
  }
});
it("rejects socket upgrades from an untrusted origin", async () => {
  const url = await start();
  const socket = new WebSocket(url.replace("http:", "ws:") + "/ws", {
    origin: "https://untrusted.invalid",
  });
  const [error] = await once(socket, "error");
  expect(error).toBeInstanceOf(Error);
  expect(socket.readyState).not.toBe(WebSocket.OPEN);
});
