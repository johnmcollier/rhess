/**
 * Agent Skills / npx skills CLI install-id rules (discovery `name` / `--skill`).
 * Must be 1–64 chars, lowercase kebab-case, no leading/trailing hyphen, no `--`.
 */
const SKILL_INSTALL_ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidSkillInstallId(value: string): boolean {
  return value.length >= 1 && value.length <= 64 && SKILL_INSTALL_ID_RE.test(value);
}
