import type { FastifyPluginAsync, FastifyRequest } from "fastify";
import type { SkillRepository } from "../db/types.js";
import { resolveBaseUrl } from "../utils/resolveBaseUrl.js";
import { buildDiscoveryIndex } from "../utils/discoveryIndex.js";

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
    return reply.send(buildDiscoveryIndex(opts.skills.findAllDiscoveryEntries(), baseUrl));
  });
};

export default wellKnownPlugin;
