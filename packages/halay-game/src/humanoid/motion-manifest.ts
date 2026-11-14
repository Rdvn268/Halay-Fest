import type { RigMap } from "./rig.js";
import { QUATERNIUS_RIG } from "./rig.js";
export interface MotionManifest {
  version: 1;
  dance: "halay";
  clip: string;
  beats: number;
  sha256: string;
  rig: RigMap;
  provenance: {
    author: string;
    source: string;
    license: string;
    commercialUse: true;
    redistribution: true;
    kind: "mocap" | "blender-authored" | "authored-study";
    evidence: string;
  };
  contacts: { side: "L" | "R"; start: number; end: number }[];
  rootMotion: { phase: number; x: number; z: number }[];
}
function fail(message: string): never {
  throw new Error(`Motion manifest: ${message}`);
}
export function parseMotionManifest(input: unknown): MotionManifest {
  if (!input || typeof input !== "object") fail("object required");
  const m = input as MotionManifest;
  if (m.version !== 1 || m.dance !== "halay")
    fail("only version 1 / Halay review is enabled");
  if (
    typeof m.clip !== "string" ||
    !m.clip.trim() ||
    !Number.isInteger(m.beats) ||
    m.beats < 2 ||
    m.beats > 128
  )
    fail("clip/beats invalid");
  if (!/^[a-f0-9]{64}$/.test(m.sha256)) fail("SHA-256 required");
  const p = m.provenance;
  if (
    !p ||
    !["mocap", "blender-authored", "authored-study"].includes(p.kind) ||
    p.commercialUse !== true ||
    p.redistribution !== true
  )
    fail("commercial and redistribution permission required");
  for (const v of [p.author, p.source, p.license, p.evidence])
    if (typeof v !== "string" || !v.trim())
      fail("provenance and evidence required");
  if (
    !m.rig ||
    Object.keys(QUATERNIUS_RIG).some(
      (k) =>
        typeof m.rig[k as keyof RigMap] !== "string" ||
        !m.rig[k as keyof RigMap].trim(),
    )
  )
    fail("explicit humanoid mapping required");
  if (
    !Array.isArray(m.contacts) ||
    !m.contacts.length ||
    m.contacts.length > 256
  )
    fail("contact markers required");
  for (const side of ["L", "R"] as const) {
    const contacts = m.contacts
      .filter((c) => c.side === side)
      .sort((a, b) => a.start - b.start);
    if (!contacts.length) fail(`no ${side} contacts`);
    contacts.forEach((c, i) => {
      if (
        !Number.isFinite(c.start) ||
        !Number.isFinite(c.end) ||
        c.start < 0 ||
        c.end > 1 ||
        c.end <= c.start ||
        (i > 0 && c.start < contacts[i - 1]!.end)
      )
        fail("invalid/overlapping contact intervals");
    });
  }
  if (m.contacts.some((c) => c.side !== "L" && c.side !== "R"))
    fail("unknown contact side");
  if (
    !Array.isArray(m.rootMotion) ||
    m.rootMotion.length < 2 ||
    m.rootMotion.length > 1000
  )
    fail("root trajectory required");
  m.rootMotion.forEach((k, i) => {
    if (
      !Number.isFinite(k.phase) ||
      !Number.isFinite(k.x) ||
      !Number.isFinite(k.z) ||
      Math.abs(k.x) > 10 ||
      Math.abs(k.z) > 10 ||
      k.phase < 0 ||
      k.phase > 1 ||
      (i > 0 && k.phase <= m.rootMotion[i - 1]!.phase)
    )
      fail("invalid root trajectory");
  });
  if (m.rootMotion[0]!.phase !== 0 || m.rootMotion.at(-1)!.phase !== 1)
    fail("root trajectory must span [0,1]");
  return m;
}
export function productionGate(
  clips: readonly {
    kind: string;
    licenseVerified: boolean;
    regionalApproved: boolean;
  }[],
  visualApproved = false,
) {
  const issues: string[] = [];
  if (
    clips.filter((c) => ["mocap", "blender-authored"].includes(c.kind)).length <
    2
  )
    issues.push("Two performance/authored Halay figures are missing");
  if (clips.some((c) => !c.licenseVerified) || !clips.length)
    issues.push("Model and motion permission evidence must be reviewed");
  if (clips.some((c) => !c.regionalApproved) || !clips.length)
    issues.push("Regional choreography review is open");
  if (!visualApproved) issues.push("User visual approval is open");
  return { accepted: issues.length === 0, issues };
}
export const danceLibraries = {
  halay: { status: "review-only", approvedFigures: [] },
  horon: { status: "locked", approvedFigures: [] },
  govend: { status: "locked", approvedFigures: [] },
  zeybek: { status: "locked", approvedFigures: [] },
} as const;
