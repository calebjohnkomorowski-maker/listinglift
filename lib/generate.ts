import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { OutputKey } from "./options";
import { buildUserPrompt, SYSTEM_PROMPT, type PromptExtras } from "./prompt";
import {
  buildOutputSchema,
  type GenerateRequest,
  type GenerateResponse,
  type GeneratedOutputs,
} from "./types";

export const MODEL = process.env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-5-5";

type Effort = "low" | "medium" | "high" | "xhigh" | "max";
const EFFORT_LEVELS: Effort[] = ["low", "medium", "high", "xhigh", "max"];
const envEffort = process.env.ANTHROPIC_EFFORT?.trim() as Effort | undefined;
/** Medium effort keeps generation snappy for demos; copywriting doesn't need deep reasoning. */
const EFFORT: Effort = envEffort && EFFORT_LEVELS.includes(envEffort) ? envEffort : "medium";

/** An error whose message is safe to show to the user. */
export class GenerationError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

let client: Anthropic | null = null;
function getClient() {
  // Created lazily so a missing key surfaces as a clean error instead of crashing at import time.
  client ??= new Anthropic({ timeout: 55_000, maxRetries: 1 });
  return client;
}

async function callModel(req: GenerateRequest, extras: PromptExtras = {}): Promise<GeneratedOutputs> {
  const schema = buildOutputSchema(req.outputs);

  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    output_config: { effort: EFFORT, format: zodOutputFormat(schema) },
    system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: buildUserPrompt(req, extras) }],
  });

  if (response.stop_reason === "refusal") {
    throw new GenerationError(
      "The model declined to write copy for this listing. Try removing anything unusual from the notes and generate again.",
      422,
    );
  }
  if (response.stop_reason === "max_tokens") {
    throw new GenerationError("The response was cut off before it finished. Please try again.", 502);
  }

  const text = response.content.find((b) => b.type === "text")?.text;
  if (!text) throw new GenerationError("The model returned an empty response. Please try again.", 502);

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new GenerationError("The model returned malformed output. Please try again.", 502);
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    console.error("Output failed validation:", parsed.error.issues);
    throw new GenerationError("The model returned output in an unexpected shape. Please try again.", 502);
  }
  return clean(parsed.data as GeneratedOutputs, req.outputs);
}

/** Tidy up whitespace and enforce simple shape rules the JSON schema can't express. */
function clean(out: GeneratedOutputs, keys: OutputKey[]): GeneratedOutputs {
  const result: GeneratedOutputs = {};
  if (keys.includes("mls") && out.mls) result.mls = out.mls.trim();
  if (keys.includes("social") && out.social) result.social = out.social.trim();
  if (keys.includes("openHouse") && out.openHouse) result.openHouse = out.openHouse.trim();
  if (keys.includes("email") && out.email) {
    result.email = { subject: out.email.subject.trim(), body: out.email.body.trim() };
  }
  if (keys.includes("headlines") && out.headlines) {
    result.headlines = out.headlines
      .map((h) => h.trim().replace(/\.$/, ""))
      .filter(Boolean)
      .slice(0, 3);
  }
  return result;
}

/** Last resort: cut at the last full sentence that fits (or the last word, with an ellipsis). */
export function trimToLimit(text: string, limit: number): string {
  if (text.length <= limit) return text;
  const slice = text.slice(0, limit);
  const lastSentenceEnd = Math.max(slice.lastIndexOf(". "), slice.lastIndexOf("! "), slice.lastIndexOf("? "));
  if (lastSentenceEnd > limit * 0.6) return slice.slice(0, lastSentenceEnd + 1).trim();
  if (/[.!?]$/.test(slice)) return slice.trim();
  const lastSpace = slice.slice(0, limit - 1).lastIndexOf(" ");
  return `${slice.slice(0, lastSpace > 0 ? lastSpace : limit - 1).trim()}…`;
}

export async function generateCopy(req: GenerateRequest): Promise<GenerateResponse> {
  const outputs = await callModel(req);
  let mlsAdjusted: GenerateResponse["meta"]["mlsAdjusted"];

  // Models can't count characters precisely, so enforce the MLS limit here.
  if (outputs.mls && outputs.mls.length > req.mlsCharLimit) {
    try {
      const shorter = await callModel(
        { ...req, outputs: ["mls"], previous: undefined },
        { shortenMls: outputs.mls },
      );
      if (shorter.mls) {
        outputs.mls = shorter.mls;
        mlsAdjusted = "shortened";
      }
    } catch (err) {
      console.error("MLS shorten pass failed:", err);
    }
    if (outputs.mls.length > req.mlsCharLimit) {
      outputs.mls = trimToLimit(outputs.mls, req.mlsCharLimit);
      mlsAdjusted = "trimmed";
    }
  }

  return { outputs, meta: { model: MODEL, mock: false, mlsAdjusted } };
}
