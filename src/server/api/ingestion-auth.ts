import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

export type IngestionAuthResult =
  { ok: true } | { ok: false; response: NextResponse<{ error: string }> };

function timingSafeStringEqual(candidate: string, expected: string) {
  // timingSafeEqual requires equal-length buffers. Hashing both sides to a
  // fixed-length digest first keeps the comparison constant-time regardless of
  // input lengths, without an early length check that would leak a timing
  // signal about the configured key's length.
  const candidateDigest = createHash("sha256").update(candidate, "utf8").digest();
  const expectedDigest = createHash("sha256").update(expected, "utf8").digest();

  return timingSafeEqual(candidateDigest, expectedDigest);
}

export function requireIngestionApiKey(request: Request): IngestionAuthResult {
  const configuredKey = process.env.INGESTION_API_KEY;

  if (!configuredKey) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "INGESTION_API_KEY is not configured" },
        { status: 500 },
      ),
    };
  }

  const authorization = request.headers.get("authorization");
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];

  if (!token || !timingSafeStringEqual(token, configuredKey)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Invalid ingestion API key" }, { status: 401 }),
    };
  }

  return { ok: true };
}
