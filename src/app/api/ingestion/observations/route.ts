import { appendAcceptedObservation, parseObservationInput } from "@/server/observations";
import { requireIngestionApiKey } from "@/server/api/ingestion-auth";
import { jsonError, jsonOk, readJsonBody } from "@/server/api/responses";

export async function POST(request: Request) {
  const auth = requireIngestionApiKey(request);
  if (!auth.ok) {
    return auth.response;
  }

  const input = parseObservationInput(await readJsonBody(request));
  if (!input) {
    return jsonError("Invalid observation payload", 400);
  }

  const result = await appendAcceptedObservation(input);
  return jsonOk(result, { status: result.status === "inserted" ? 201 : 422 });
}
