import { createKpiDefinition, listKpiDefinitions, parseKpiDefinitionInput } from "@/server/kpis";
import { requireApiRole } from "@/server/api/authz";
import { jsonListWithRole } from "@/server/api/handlers";
import { jsonError, jsonOk, readJsonBody } from "@/server/api/responses";

export async function GET() {
  return jsonListWithRole("OPERATOR", "kpis", listKpiDefinitions);
}

export async function POST(request: Request) {
  const auth = await requireApiRole("OPERATOR");
  if (!auth.ok) {
    return auth.response;
  }

  const input = parseKpiDefinitionInput(await readJsonBody(request));
  if (!input) {
    return jsonError("Invalid KPI definition payload", 400);
  }

  return jsonOk({ kpi: await createKpiDefinition(input) }, { status: 201 });
}
