/** A separate loopback port range keeps automated scenes away from the user's live preview. */
export function localPorts(value = process.env["HALAY_PORT_OFFSET"] ?? "0") {
  if (!/^\d+$/.test(value) || Number(value) > 50000)
    throw new Error("HALAY_PORT_OFFSET must be an integer between 0 and 50000");
  const offset = Number(value);
  return {
    gateway: 8787 + offset,
    devScene: 5173 + offset,
    devPanel: 5174 + offset,
    productionScene: 4174 + offset,
    productionPanel: 4175 + offset,
  };
}
