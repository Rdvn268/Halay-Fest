import { serverMessageSchema } from "@halay/contracts";
import type { ServerMessage } from "@halay/contracts";

export type ConnectionStatus =
  "connecting" | "connected" | "reconnecting" | "disconnected";
export function connectGateway(
  onMessage: (message: ServerMessage) => void,
  onStatus: (status: ConnectionStatus) => void,
) {
  let stopped = false;
  let socket: WebSocket | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let attempts = 0;
  const connect = () => {
    if (stopped) return;
    onStatus(attempts ? "reconnecting" : "connecting");
    socket = new WebSocket(
      `${location.protocol === "https:" ? "wss:" : "ws:"}//${location.host}/ws`,
    );
    socket.onmessage = ({ data }: MessageEvent<unknown>) => {
      try {
        if (typeof data !== "string") throw new Error("Invalid frame");
        const message = serverMessageSchema.parse(JSON.parse(data));
        attempts = 0;
        onStatus("connected");
        onMessage(message);
      } catch {
        socket?.close(1002, "Invalid protocol");
      }
    };
    socket.onerror = () => socket?.close();
    socket.onclose = () => {
      if (stopped) return;
      onStatus("reconnecting");
      attempts++;
      timer = setTimeout(
        connect,
        Math.min(5000, 500 * 2 ** Math.min(attempts, 4)),
      );
    };
  };
  connect();
  return () => {
    stopped = true;
    clearTimeout(timer);
    socket?.close();
    onStatus("disconnected");
  };
}
export async function postJson(path: string, body: unknown): Promise<unknown> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result: unknown = await response.json();
  if (!response.ok) {
    const message =
      typeof result === "object" && result && "error" in result
        ? String(result.error)
        : "İşlem başarısız";
    throw new Error(message);
  }
  return result;
}
