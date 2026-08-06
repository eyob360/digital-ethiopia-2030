// Accessibility evidence for WO-0005 per D-0018 / D-0013 (WCAG 2.2 AA):
// axe scans plus scripted keyboard-navigation and focus-visibility checks
// across the MVP page set (D-0012). The app has a single (light) theme.
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { OPERATOR, TEST_KPI_NAME, focusedElementHasVisibleIndicator, login } from "./helpers";

const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

async function scan(page: import("@playwright/test").Page) {
  const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
  const summary = results.violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    help: v.help,
    nodes: v.nodes.map((n) => n.target.join(" ")).slice(0, 5),
  }));
  expect(summary, JSON.stringify(summary, null, 2)).toEqual([]);
}

test.describe("axe WCAG 2.2 AA scans (D-0018)", () => {
  test("login page", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
    await scan(page);
  });

  test("dashboard overview", async ({ page }) => {
    await login(page, OPERATOR);
    await scan(page);
  });

  test("KPI detail (with history table)", async ({ page }) => {
    await login(page, OPERATOR);
    await page
      .getByRole("article")
      .filter({ hasText: TEST_KPI_NAME })
      .getByRole("link", { name: "Open KPI detail" })
      .click();
    await expect(page.getByRole("table")).toBeVisible();
    await scan(page);
  });

  test("KPI admin", async ({ page }) => {
    await login(page, OPERATOR);
    await page.goto("/admin/kpis");
    await expect(page.getByLabel("Name")).toBeVisible();
    await scan(page);
  });

  test("pipeline status", async ({ page }) => {
    await login(page, OPERATOR);
    await page.goto("/pipeline");
    await expect(page.getByRole("heading", { name: "Pipeline status" })).toBeVisible();
    await scan(page);
  });

  test("account", async ({ page }) => {
    await login(page, OPERATOR);
    await page.goto("/account");
    await expect(page.getByRole("heading", { name: "Session basics" })).toBeVisible();
    await scan(page);
  });
});

test.describe("keyboard access and focus visibility (D-0013)", () => {
  test("login form is fully keyboard operable with visible focus", async ({ page }) => {
    await page.goto("/login");
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Email")).toBeFocused();
    expect(await focusedElementHasVisibleIndicator(page)).toBe(true);

    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Password")).toBeFocused();
    expect(await focusedElementHasVisibleIndicator(page)).toBe(true);

    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Sign in" })).toBeFocused();
    expect(await focusedElementHasVisibleIndicator(page)).toBe(true);

    // Keyboard-only sign-in: fill via keyboard and submit with Enter
    await page.getByLabel("Email").focus();
    await page.keyboard.type(OPERATOR.email);
    await page.keyboard.press("Tab");
    await page.keyboard.type(OPERATOR.password);
    await page.keyboard.press("Enter");
    await expect(page.getByRole("heading", { name: "Digital Ethiopia 2030 KPIs" })).toBeVisible();
  });

  test("overview: nav links and category filter are keyboard reachable, operable, focus-visible", async ({
    page,
  }) => {
    await login(page, OPERATOR);

    // Tab through the header until the primary nav's first link has focus
    const firstNavLink = page
      .getByRole("navigation", { name: "Primary navigation" })
      .getByRole("link", { name: "Dashboard" });
    for (let i = 0; i < 10; i += 1) {
      await page.keyboard.press("Tab");
      if (await firstNavLink.evaluate((el) => el === document.activeElement)) break;
    }
    await expect(firstNavLink).toBeFocused();
    expect(await focusedElementHasVisibleIndicator(page)).toBe(true);

    // Category filter buttons: focus and activate with the keyboard
    const filter = page.getByRole("group", { name: "Filter KPIs by category" });
    const target = filter.getByRole("button", { name: "Empower People & Institutions" });
    await target.focus();
    expect(await focusedElementHasVisibleIndicator(page)).toBe(true);
    await page.keyboard.press("Enter");
    await expect(target).toHaveAttribute("aria-pressed", "true");
  });

  test("KPI admin: form fields keyboard reachable with visible focus", async ({ page }) => {
    await login(page, OPERATOR);
    await page.goto("/admin/kpis");

    const nameField = page.getByLabel("Name");
    await nameField.focus();
    await expect(nameField).toBeFocused();
    expect(await focusedElementHasVisibleIndicator(page)).toBe(true);

    // Tab moves through the form fields in order
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Category")).toBeFocused();
    expect(await focusedElementHasVisibleIndicator(page)).toBe(true);
  });

  test("KPI detail: source links keyboard reachable with visible focus", async ({ page }) => {
    await login(page, OPERATOR);
    await page
      .getByRole("article")
      .filter({ hasText: TEST_KPI_NAME })
      .getByRole("link", { name: "Open KPI detail" })
      .click();
    const sourceLink = page.getByRole("table").getByRole("link", { name: "Source" }).first();
    // Reach the link by keyboard only, so :focus-visible applies as a real
    // keyboard user would see it.
    let reached = false;
    for (let i = 0; i < 60; i += 1) {
      await page.keyboard.press("Tab");
      if (await sourceLink.evaluate((el) => el === document.activeElement)) {
        reached = true;
        break;
      }
    }
    expect(reached, "source link must be reachable by Tab").toBe(true);
    expect(await focusedElementHasVisibleIndicator(page)).toBe(true);
  });
});
