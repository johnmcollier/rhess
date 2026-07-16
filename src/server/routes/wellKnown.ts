import type { FastifyPluginAsync, FastifyRequest } from "fastify";
import type { SkillRepository } from "../db/types.js";
import { resolveBaseUrl } from "../utils/resolveBaseUrl.js";
import { isValidSkillInstallId } from "../utils/skillInstallId.js";

interface WellKnownOptions {
  skills: SkillRepository;
}

const wellKnownPlugin: FastifyPluginAsync<WellKnownOptions> = async (fastify, opts) => {
  fastify.get("/agent-skills/index.json", {
    schema: {
      tags: ["Discovery"],
      summary: "Agent Skills discovery index",
      description:
        "Returns the Agent Skills CLI discovery manifest. " +
        "Each entry contains the skill name, type (`skill-md` or `archive`), " +
        "description, artifact URL, and SHA-256 digest. " +
        "Set `PUBLIC_BASE_URL` when running behind a reverse proxy to ensure correct artifact URLs.",
      response: {
        200: {
          type: "object",
          properties: {
            $schema: { type: "string" },
            skills: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  type: { type: "string", enum: ["skill-md", "archive"] },
                  description: { type: "string" },
                  url: { type: "string", format: "uri" },
                  digest: { type: "string", description: "sha256:<hex> content digest" },
                },
                required: ["name", "type", "description", "url", "digest"],
              },
            },
          },
        },
      },
    },
  }, async (req: FastifyRequest, reply) => {
    const baseUrl = resolveBaseUrl(req);
    const entries = opts.skills.findAllDiscoveryEntries();
    return reply.send({
      // Opaque schema URI required by the Agent Skills discovery RFC / npx skills CLI.
      // Clients match this exactly; a different v0.2.0-looking URI is rejected.
      $schema: "https://schemas.agentskills.io/discovery/0.2.0/schema.json",
      skills: entries
        .filter((s) => isValidSkillInstallId(s.slug))
        .map((s) => ({
          // Discovery `name` must be a kebab-case install id ([a-z0-9-]+). Prefer slug
          // over frontmatter display names that may contain spaces or mixed case.
          name: s.slug,
          type: s.artifactType,
          // CLI rejects descriptions longer than 1024 characters.
          description: s.description.length > 1024
            ? `${s.description.slice(0, 1023)}…`
            : s.description,
          url: `${baseUrl}/api/v1/skills/${encodeURIComponent(s.sourceSlug)}/${encodeURIComponent(s.slug)}/artifact`,
          digest: `sha256:${s.digest}`,
        })),
    });
  });
};

export default wellKnownPlugin;
