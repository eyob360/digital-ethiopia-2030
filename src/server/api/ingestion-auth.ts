import { NextResponse } from "next/server";

export type IngestionAuthResult =
  { ok: true } | { ok: false; response: NextResponse<{ error: string }> };

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

  if (token !== configuredKey) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Invalid ingestion API key" }, { status: 401 }),
    };
  }

  return { ok: true };
}
