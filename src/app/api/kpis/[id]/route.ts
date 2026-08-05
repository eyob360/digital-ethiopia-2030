import {
  deleteKpiDefinition,
  getKpiDefinition,
  parseKpiDefinitionInput,
  updateKpiDefinition,
} from "@/server/kpis";
import { requireApiRole } from "@/server/api/authz";
import { jsonError, jsonOk, readJsonBody } from "@/server/api/responses";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireApiRole("OPERATOR");
  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await context.params;
  const kpi = await getKpiDefinition(id);

  return kpi ? jsonOk({ kpi }) : jsonError("KPI definition not found", 404);
}

export async function PUT(request: Request, context: RouteContext) {
  const auth = await requireApiRole("OPERATOR");
  if (!auth.ok) {
    return auth.response;
  }

  const input = parseKpiDefinitionInput(await readJsonBody(request));
  if (!input) {
    return jsonError("Invalid KPI definition payload", 400);
  }

  const { id } = await context.params;

  return jsonOk({ kpi: await updateKpiDefinition(id, input) });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireApiRole("OPERATOR");
  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await context.params;
  await deleteKpiDefinition(id);

  return new Response(null, { status: 204 });
}
