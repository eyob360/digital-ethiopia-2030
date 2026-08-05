import { loadEligibleKpisForPipeline } from "@/server/kpis";
import { requireIngestionApiKey } from "@/server/api/ingestion-auth";
import { jsonOk } from "@/server/api/responses";

export async function GET(request: Request) {
  const auth = requireIngestionApiKey(request);
  if (!auth.ok) {
    return auth.response;
  }

  return jsonOk({ kpis: await loadEligibleKpisForPipeline() });
}
