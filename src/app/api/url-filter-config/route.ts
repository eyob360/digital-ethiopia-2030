import { defaultBlockedDomainCategories } from "@/lib/pipeline";
import { requireApiRole } from "@/server/api/authz";
import { jsonError, jsonOk, readJsonBody } from "@/server/api/responses";
import {
  getUrlFilterConfig,
  parseUrlFilterConfigInput,
  updateUrlFilterConfig,
} from "@/server/url-filter-config";

export async function GET() {
  const auth = await requireApiRole("OPERATOR");
  if (!auth.ok) {
    return auth.response;
  }

  return jsonOk({
    config: await getUrlFilterConfig(),
    defaultBlockedDomainCategories,
  });
}

export async function PUT(request: Request) {
  const auth = await requireApiRole("OPERATOR");
  if (!auth.ok) {
    return auth.response;
  }

  const input = parseUrlFilterConfigInput(await readJsonBody(request));
  if (!input) {
    return jsonError("Invalid URL filter configuration payload", 400);
  }

  return jsonOk({ config: await updateUrlFilterConfig(input) });
}
