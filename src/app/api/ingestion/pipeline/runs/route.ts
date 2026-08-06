import { handlePipelineRunAction } from "@/server/api/handlers";
import { requireIngestionApiKey } from "@/server/api/ingestion-auth";
import { readJsonBody } from "@/server/api/responses";

export async function POST(request: Request) {
  const auth = requireIngestionApiKey(request);
  if (!auth.ok) {
    return auth.response;
  }

  return handlePipelineRunAction(await readJsonBody(request));
}
