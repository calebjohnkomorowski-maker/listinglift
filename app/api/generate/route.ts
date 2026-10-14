import Anthropic from "@anthropic-ai/sdk";
import { NextResponse, type NextRequest } from "next/server";
import { generateCopy, GenerationError } from "@/lib/generate";
import { generateMock } from "@/lib/mock";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";
import { GenerateRequestSchema, type GenerateErrorResponse } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BODY_BYTES = 64 * 1024;

function errorResponse(error: string, status: number, headers?: HeadersInit) {
  return NextResponse.json<GenerateErrorResponse>({ error }, { status, headers });
}

export async function POST(request: NextRequest) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return errorResponse("That request is too large. Try shortening your notes.", 413);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Request body must be valid JSON.", 400);
  }

  const parsed = GenerateRequestSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = issue?.path.join(".");
    return errorResponse(
      issue ? `${issue.message}${field && !issue.message.includes("required") ? ` (${field})` : ""}` : "Invalid request.",
      400,
    );
  }

  const limit = checkRateLimit(clientIp(request.headers));
  if (!limit.ok) {
    return errorResponse(limit.message, 429, { "Retry-After": String(limit.retryAfterSec) });
  }

  if (process.env.LISTINGLIFT_MOCK === "1") {
    return NextResponse.json(await generateMock(parsed.data));
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return errorResponse(
      "The server is missing ANTHROPIC_API_KEY. Add it to .env.local (or your Vercel project settings) and restart.",
      500,
    );
  }

  try {
    return NextResponse.json(await generateCopy(parsed.data));
  } catch (err) {
    if (err instanceof GenerationError) return errorResponse(err.message, err.status);
    console.error("Generation failed:", err);
    if (err instanceof Anthropic.AuthenticationError) {
      return errorResponse("The Anthropic API key was rejected. Check ANTHROPIC_API_KEY.", 500);
    }
    if (err instanceof Anthropic.NotFoundError) {
      return errorResponse("The configured model wasn't found. Check ANTHROPIC_MODEL.", 500);
    }
    if (err instanceof Anthropic.RateLimitError) {
      return errorResponse("The AI service is busy right now. Wait a moment and try again.", 503);
    }
    if (err instanceof Anthropic.APIConnectionTimeoutError) {
      return errorResponse("Generation timed out. Please try again.", 504);
    }
    if (err instanceof Anthropic.APIError) {
      return errorResponse("The AI service returned an error. Please try again.", 502);
    }
    return errorResponse("Something went wrong while generating. Please try again.", 500);
  }
}
