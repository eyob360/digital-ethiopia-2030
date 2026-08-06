import { appendAcceptedObservation, parseObservationInput } from "@/server/observations";
import { requireIngestionApiKey } from "@/server/api/ingestion-auth";
import { jsonError, jsonOk, readJsonBody } from "@/server/api/responses";

export async function POST(request: Request) {
  const auth = requireIngestionApiKey(request);
  if (!auth.ok) {
    return auth.response;
  }

  const body = await readJsonBody(request);
  const input = parseObservationInput(body);
  if (!input) {
    return jsonError("Invalid observation payload", 400);
  }

  const result = await appendAcceptedObservation(input);
  return jsonOk(
    {
      ...result,
      ...parseRoutingContext(body),
    },
    { status: result.status === "inserted" ? 201 : 200 },
  );
}

function parseRoutingContext(input: unknown) {
  if (!input || typeof input !== "object") {
    return {};
  }

  const record = input as Record<string, unknown>;

  return {
    runId: typeof record.runId === "string" ? record.runId : null,
    branchKey: typeof record.branchKey === "string" ? record.branchKey : null,
    kpiId: typeof record.kpiId === "string" ? record.kpiId : null,
    fallbackUsed: typeof record.fallbackUsed === "boolean" ? record.fallbackUsed : false,
    sourceType: typeof record.sourceType === "string" ? record.sourceType : null,
    candidateUrls: Array.isArray(record.candidateUrls)
      ? record.candidateUrls.filter((url): url is string => typeof url === "string")
      : [],
    priorityIndex: typeof record.priorityIndex === "number" ? record.priorityIndex : 0,
  };
}
