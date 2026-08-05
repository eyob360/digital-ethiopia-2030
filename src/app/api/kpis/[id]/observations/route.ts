import { appendAcceptedObservation, parseObservationInput } from "@/server/observations";
import { getKpiHistory } from "@/server/dashboard";
import { requireApiRole } from "@/server/api/authz";
import { jsonError, jsonOk, readJsonBody } from "@/server/api/responses";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireApiRole("VIEWER");
  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await context.params;

  return jsonOk({ observations: await getKpiHistory(id) });
}

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireApiRole("OPERATOR");
  if (!auth.ok) {
    return auth.response;
  }

  const body = await readJsonBody(request);
  const { id } = await context.params;
  const input = parseObservationInput({
    ...(typeof body === "object" && body ? body : {}),
    kpiId: id,
  });

  if (!input) {
    return jsonError("Invalid observation payload", 400);
  }

  const result = await appendAcceptedObservation(input);

  if (result.status === "rejected") {
    return jsonError("Observation rejected by deterministic validation", 422);
  }

  return jsonOk({ observation: result.observation }, { status: 201 });
}
