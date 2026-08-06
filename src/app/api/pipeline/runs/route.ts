import { handlePipelineRunAction } from "@/server/api/handlers";
import { requireApiRole } from "@/server/api/authz";
import { readJsonBody } from "@/server/api/responses";

export async function POST(request: Request) {
  const auth = await requireApiRole("OPERATOR");
  if (!auth.ok) {
    return auth.response;
  }

  return handlePipelineRunAction(await readJsonBody(request));
}
