import { it, expect } from "vitest";
import { localPorts } from "../../scripts/local-ports.js";
it("preserves the published preview URLs by default", () => {
  expect(localPorts("0")).toEqual({
    gateway: 8787,
    devScene: 5173,
    devPanel: 5174,
    productionScene: 4174,
    productionPanel: 4175,
  });
});
it("isolates both development and production tests from all preview ports", () => {
  const preview = Object.values(localPorts("0")),
    test = Object.values(localPorts("10000"));
  expect(new Set([...preview, ...test]).size).toBe(
    preview.length + test.length,
  );
  expect(test.every((port) => port >= 1024 && port <= 65535)).toBe(true);
});
it("rejects invalid offsets instead of starting on unintended ports", () => {
  for (const value of ["-1", "no-port", "1.5", "50001"])
    expect(() => localPorts(value)).toThrow("HALAY_PORT_OFFSET");
});
