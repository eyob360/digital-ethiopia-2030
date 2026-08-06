import { expect, type Page } from "@playwright/test";

export const OPERATOR = {
  email: "operator@example.local",
  password: process.env.SEED_OPERATOR_PASSWORD ?? "ValOp2026!x",
};

export const VIEWER = {
  email: "viewer@example.local",
  password: process.env.E2E_VIEWER_PASSWORD ?? "ValViewer2026!x",
};

export const TEST_KPI_NAME = "Digital economy share of GDP";

export async function login(page: Page, user: { email: string; password: string }) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Password").fill(user.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Digital Ethiopia 2030 KPIs" })).toBeVisible();
}

/** True when the focused element paints a visible focus indicator. */
export async function focusedElementHasVisibleIndicator(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return false;
    const style = window.getComputedStyle(el);
    const hasOutline = style.outlineStyle !== "none" && parseFloat(style.outlineWidth) > 0;
    const hasBoxShadow = style.boxShadow !== "none" && style.boxShadow !== "";
    return hasOutline || hasBoxShadow;
  });
}
