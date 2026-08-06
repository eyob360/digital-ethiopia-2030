import { asNonEmptyString } from "../../lib/strings";
import { completePipelineRunBranch, startPipelineRun } from "../pipeline";
import type { ApiRoleRequirement } from "./authz";
import { requireApiRole } from "./authz";
import { jsonError, jsonOk } from "./responses";

export async function jsonListWithRole<T>(
  requirement: ApiRoleRequirement,
  key: string,
  loadItems: () => Promise<T[]>,
) {
  const auth = await requireApiRole(requirement);
  if (!auth.ok) {
    return auth.response;
  }

  return jsonOk({ [key]: await loadItems() });
}

// Single implementation behind the identical operator-facing (`/api/pipeline/runs`)
// and n8n-facing (`/api/ingestion/pipeline/runs`) routes; the routes differ only in
// how they authenticate the caller.
export async function handlePipelineRunAction(body: unknown) {
  const action = body && typeof body === "object" ? (body as Record<string, unknown>).action : null;

  if (action === "start") {
    const result = await startPipelineRun();
    return jsonOk(result, { status: result.started ? 200 : 409 });
  }

  if (action === "complete") {
    const runId = asNonEmptyString((body as Record<string, unknown>).runId);
    const branchKey = asNonEmptyString((body as Record<string, unknown>).branchKey);
    if (!runId || !branchKey) {
      return jsonError("Pipeline completion requires runId and branchKey", 400);
    }

    return jsonOk(await completePipelineRunBranch({ runId, branchKey }));
  }

  return jsonError("Unsupported pipeline run action", 400);
}
