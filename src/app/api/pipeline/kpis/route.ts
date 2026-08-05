import { loadPipelineKpiBatch } from "@/server/pipeline";
import { requireApiRole } from "@/server/api/authz";
import { jsonOk } from "@/server/api/responses";

export async function GET() {
  const auth = await requireApiRole("operator");
  if (!auth.ok) {
    return auth.response;
  }

  return jsonOk({ kpis: await loadPipelineKpiBatch() });
}
