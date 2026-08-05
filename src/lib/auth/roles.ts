export const userRoles = ["OPERATOR", "VIEWER"] as const;

export type UserRole = (typeof userRoles)[number];

export function canViewDashboard(role: UserRole | null | undefined) {
  return role === "OPERATOR" || role === "VIEWER";
}

export function canUseOperatorControls(role: UserRole | null | undefined) {
  return role === "OPERATOR";
}

export function assertKnownRole(role: string): asserts role is UserRole {
  if (!userRoles.includes(role as UserRole)) {
    throw new Error(`Unknown user role: ${role}`);
  }
}
