import { loadEligibleKpisForPipeline } from "@/server/kpis";
import { jsonListWithRole } from "@/server/api/handlers";

export async function GET() {
  return jsonListWithRole("OPERATOR", "kpis", loadEligibleKpisForPipeline);
}
