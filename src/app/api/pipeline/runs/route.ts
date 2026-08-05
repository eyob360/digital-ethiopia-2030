import { releasePipelineLock, startPipelineRun } from "@/server/pipeline";
import { requireApiRole } from "@/server/api/authz";
import { jsonError, jsonOk, readJsonBody } from "@/server/api/responses";

export async function POST(request: Request) {
  const auth = await requireApiRole("OPERATOR");
  if (!auth.ok) {
    return auth.response;
  }

  const body = await readJsonBody(request);
  const action = body && typeof body === "object" ? (body as Record<string, unknown>).action : null;

  if (action === "start") {
    const result = await startPipelineRun();
    return jsonOk(result, { status: result.started ? 200 : 409 });
  }

  if (action === "complete") {
    return jsonOk({ lock: await releasePipelineLock() });
  }

  return jsonError("Unsupported pipeline run action", 400);
}
