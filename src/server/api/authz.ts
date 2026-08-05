import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { canUseOperatorControls, canViewDashboard, type UserRole } from "../../lib/auth/roles";

export type ApiRoleRequirement = UserRole;

export type ApiAuthResult =
  { ok: true; role: UserRole } | { ok: false; response: NextResponse<{ error: string }> };

export function authorizeRole(
  role: UserRole | null | undefined,
  requirement: ApiRoleRequirement,
): ApiAuthResult {
  if (!role) {
    return unauthorized();
  }

  if (requirement === "VIEWER" && canViewDashboard(role)) {
    return { ok: true, role };
  }

  if (requirement === "OPERATOR" && canUseOperatorControls(role)) {
    return { ok: true, role };
  }

  return forbidden();
}

export async function requireApiRole(requirement: ApiRoleRequirement): Promise<ApiAuthResult> {
  const { authOptions } = await import("../auth");
  const session = await getServerSession(authOptions);

  return authorizeRole(session?.user.role, requirement);
}

export function unauthorized() {
  return {
    ok: false,
    response: NextResponse.json({ error: "Authentication required" }, { status: 401 }),
  } as const;
}

export function forbidden() {
  return {
    ok: false,
    response: NextResponse.json({ error: "Insufficient permissions" }, { status: 403 }),
  } as const;
}
