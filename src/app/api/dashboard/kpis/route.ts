import { getDashboardKpis } from "@/server/dashboard";
import { requireApiRole } from "@/server/api/authz";
import { jsonOk } from "@/server/api/responses";

export async function GET() {
  const auth = await requireApiRole("viewer");
  if (!auth.ok) {
    return auth.response;
  }

  return jsonOk({ kpis: await getDashboardKpis() });
}
