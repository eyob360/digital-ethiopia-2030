import { acquirePipelineLock, getPipelineLockStatus, releasePipelineLock } from "@/server/pipeline";
import { requireApiRole } from "@/server/api/authz";
import { jsonError, jsonOk, readJsonBody } from "@/server/api/responses";

export async function GET() {
  const auth = await requireApiRole("operator");
  if (!auth.ok) {
    return auth.response;
  }

  return jsonOk({ lock: await getPipelineLockStatus() });
}

export async function POST(request: Request) {
  const auth = await requireApiRole("operator");
  if (!auth.ok) {
    return auth.response;
  }

  const body = await readJsonBody(request);
  const action = body && typeof body === "object" ? (body as Record<string, unknown>).action : null;

  if (action === "acquire") {
    const result = await acquirePipelineLock();
    return jsonOk(result, { status: result.acquired ? 200 : 409 });
  }

  if (action === "release") {
    return jsonOk({ lock: await releasePipelineLock() });
  }

  return jsonError("Unsupported pipeline lock action", 400);
}
