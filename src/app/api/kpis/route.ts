import { createKpiDefinition, listKpiDefinitions, parseKpiDefinitionInput } from "@/server/kpis";
import { requireApiRole } from "@/server/api/authz";
import { jsonError, jsonOk, readJsonBody } from "@/server/api/responses";

export async function GET() {
  const auth = await requireApiRole("operator");
  if (!auth.ok) {
    return auth.response;
  }

  return jsonOk({ kpis: await listKpiDefinitions() });
}

export async function POST(request: Request) {
  const auth = await requireApiRole("operator");
  if (!auth.ok) {
    return auth.response;
  }

  const input = parseKpiDefinitionInput(await readJsonBody(request));
  if (!input) {
    return jsonError("Invalid KPI definition payload", 400);
  }

  return jsonOk({ kpi: await createKpiDefinition(input) }, { status: 201 });
}
