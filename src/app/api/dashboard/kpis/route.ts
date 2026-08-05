import { getDashboardKpis } from "@/server/dashboard";
import { jsonListWithRole } from "@/server/api/handlers";

export async function GET() {
  return jsonListWithRole("VIEWER", "kpis", getDashboardKpis);
}
