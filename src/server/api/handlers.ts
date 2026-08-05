import type { ApiRoleRequirement } from "./authz";
import { requireApiRole } from "./authz";
import { jsonOk } from "./responses";

export async function jsonListWithRole<T>(
  requirement: ApiRoleRequirement,
  key: string,
  loadItems: () => Promise<T[]>,
) {
  const auth = await requireApiRole(requirement);
  if (!auth.ok) {
    return auth.response;
  }

  return jsonOk({ [key]: await loadItems() });
}
