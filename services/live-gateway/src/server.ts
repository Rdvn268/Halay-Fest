import { createServer } from "node:http";
import type { IncomingMessage } from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import { controlSchema } from "@halay/contracts";
import type { ServerMessage } from "@halay/contracts";
import {
  initialState,
  applyEvent,
  applyControl,
  updateSettings,
} from "@halay/game-core";
import { LocalStore } from "./database.js";
import { MockSourceAdapter } from "./source.js";
import { MusicService } from "./music-service.js";

async function readJson(
  request: IncomingMessage,
  limit = 16_384,
): Promise<unknown> {
  if (!request.headers["content-type"]?.startsWith("application/json"))
    throw new Error("JSON gerekli.");
  if (Number(request.headers["content-length"] ?? 0) > limit)
    throw new Error("İstek çok büyük.");
  let bytes = 0;
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    const buffer = Buffer.from(chunk as Uint8Array);
    bytes += buffer.length;
    if (bytes > limit) throw new Error("İstek çok büyük.");
    chunks.push(buffer);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
}

export function createGateway(options: {
  databasePath: string;
  allowedOrigins: string[];
  musicDirectory?: string;
}) {
  const store = new LocalStore(options.databasePath);
  const adapter = new MockSourceAdapter();
  let state = initialState(store.loadSettings());
  const sockets = new WebSocketServer({ noServer: true, maxPayload: 16_384 });
  const broadcast = (message: ServerMessage) => {
    for (const socket of sockets.clients) {
      if (socket.bufferedAmount > 1_048_576) {
        socket.close(1013, "Slow consumer");
        continue;
      }
      if (socket.readyState === WebSocket.OPEN)
        socket.send(JSON.stringify(message));
    }
  };
  const allowedOrigin = (origin: string | undefined) =>
    origin === undefined || options.allowedOrigins.includes(origin);
  const music = options.musicDirectory
    ? new MusicService(store.db, options.musicDirectory, broadcast)
    : undefined;
  let rateStart = Date.now();
  let requests = 0;
  const server = createServer(async (request, response) => {
    response.setHeader("Content-Type", "application/json; charset=utf-8");
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("X-Content-Type-Options", "nosniff");
    const reply = (status: number, data: unknown) => {
      response.writeHead(status).end(JSON.stringify(data));
    };
    if (!allowedOrigin(request.headers.origin)) {
      reply(403, { error: "Origin reddedildi." });
      return;
    }
    // Exact host validation also prevents DNS rebinding against the local gateway.
    if (!/^127\.0\.0\.1:\d+$/.test(request.headers.host ?? "")) {
      reply(403, { error: "Host reddedildi." });
      return;
    }
    const path = request.url?.split("?")[0];
    if (music && (await music.handle(request, response, readJson))) return;
    if (request.method === "GET" && path === "/api/health") {
      reply(200, { status: "ok", source: "mock", tiktokStatus: "unsupported" });
      return;
    }
    if (request.method === "GET" && path === "/api/state") {
      reply(200, state);
      return;
    }
    if (request.method !== "POST") {
      reply(404, { error: "Bulunamadı." });
      return;
    }
    if (Date.now() - rateStart > 60_000) {
      rateStart = Date.now();
      requests = 0;
    }
    if (++requests > 120) {
      reply(429, { error: "Demo istek sınırı aşıldı." });
      return;
    }
    try {
      const body = await readJson(request);
      if (path === "/api/mock") {
        const event = adapter.normalize(body);
        if (!store.record(event)) {
          reply(200, {
            accepted: false,
            reason: "duplicate",
            eventId: event.eventId,
          });
          return;
        }
        state = applyEvent(state, event);
        broadcast({ kind: "snapshot", snapshot: state });
        broadcast({ kind: "event", event });
        reply(200, { accepted: true, eventId: event.eventId });
      } else if (path === "/api/settings") {
        const next = updateSettings(state, body);
        store.saveSettings(next.settings);
        state = next;
        broadcast({ kind: "snapshot", snapshot: state });
        reply(200, state.settings);
      } else if (path === "/api/control") {
        state = applyControl(state, controlSchema.parse(body).action);
        broadcast({ kind: "snapshot", snapshot: state });
        reply(200, { ok: true });
      } else reply(404, { error: "Bulunamadı." });
    } catch (error) {
      // No raw body or internal storage details are exposed.
      const isInput =
        error instanceof SyntaxError ||
        (error instanceof Error &&
          (error.name === "ZodError" ||
            /Kapasite|JSON gerekli|İstek çok büyük/.test(error.message)));
      reply(isInput ? 400 : 500, {
        error: isInput
          ? "Geçersiz istek veya kapasite sınırı."
          : "Yerel kayıt/işlem başarısız.",
      });
    }
  });
  server.on("upgrade", (request, socket, head) => {
    if (
      request.url !== "/ws" ||
      !allowedOrigin(request.headers.origin) ||
      !/^127\.0\.0\.1:\d+$/.test(request.headers.host ?? "")
    ) {
      socket.destroy();
      return;
    }
    sockets.handleUpgrade(request, socket, head, (ws) =>
      sockets.emit("connection", ws),
    );
  });
  sockets.on("connection", (socket) => {
    socket.send(
      JSON.stringify({
        kind: "snapshot",
        snapshot: state,
      } satisfies ServerMessage),
    );
    if (music)
      socket.send(
        JSON.stringify({
          kind: "music",
          library: music.library,
        } satisfies ServerMessage),
      );
    // Clients consume snapshots; mutations are validated through HTTP only.
    socket.on("message", () => socket.close(1008, "Read-only socket"));
    socket.on("error", () => socket.terminate());
  });
  const alive = new WeakSet<WebSocket>();
  const heartbeat = setInterval(() => {
    for (const socket of sockets.clients) {
      if (!alive.has(socket)) {
        socket.terminate();
        continue;
      }
      alive.delete(socket);
      socket.ping();
    }
  }, 15_000);
  heartbeat.unref();
  sockets.on("connection", (socket) => {
    alive.add(socket);
    socket.on("pong", () => alive.add(socket));
  });
  return {
    server,
    store,
    getState: () => state,
    close: async () => {
      clearInterval(heartbeat);
      for (const socket of sockets.clients) socket.terminate();
      await new Promise<void>((resolve) => sockets.close(() => resolve()));
      if (server.listening)
        await new Promise<void>((resolve, reject) =>
          server.close((error) => (error ? reject(error) : resolve())),
        );
      store.close();
    },
  };
}
