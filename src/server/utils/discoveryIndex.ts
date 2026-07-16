import type { SkillDiscoveryEntry } from "../db/types.js";
import { isValidSkillInstallId } from "./skillInstallId.js";

export const DISCOVERY_SCHEMA =
  "https://schemas.agentskills.io/discovery/0.2.0/schema.json";

export interface DiscoverySkillEntry {
  name: string;
  type: "skill-md" | "archive";
  description: string;
  url: string;
  digest: string;
}

/** Map a DB discovery row to a CLI-compatible index entry, or null if unusable. */
export function toDiscoverySkillEntry(
  skill: SkillDiscoveryEntry,
  baseUrl: string,
): DiscoverySkillEntry | null {
  if (!isValidSkillInstallId(skill.slug)) return null;
  return {
    // Discovery `name` must be a kebab-case install id ([a-z0-9-]+).
    name: skill.slug,
    type: skill.artifactType,
    // CLI rejects descriptions longer than 1024 characters.
    description:
      skill.description.length > 1024
        ? `${skill.description.slice(0, 1023)}…`
        : skill.description,
    url: `${baseUrl}/api/v1/skills/${encodeURIComponent(skill.sourceSlug)}/${encodeURIComponent(skill.slug)}/artifact`,
    digest: `sha256:${skill.digest}`,
  };
}

export function buildDiscoveryIndex(
  entries: SkillDiscoveryEntry[],
  baseUrl: string,
): { $schema: string; skills: DiscoverySkillEntry[] } {
  return {
    $schema: DISCOVERY_SCHEMA,
    skills: entries
      .map((s) => toDiscoverySkillEntry(s, baseUrl))
      .filter((s): s is DiscoverySkillEntry => s !== null),
  };
}
