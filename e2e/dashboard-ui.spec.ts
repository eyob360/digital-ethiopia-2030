// Functional acceptance checks for WO-0005 (BRD-0001.R2, BRD-0003.R3/R4/R6).
// See playwright.config.ts header for prerequisites.
import { expect, test } from "@playwright/test";
import { OPERATOR, TEST_KPI_NAME, VIEWER, login } from "./helpers";

test.describe("unauthenticated access", () => {
  test("dashboard redirects to login (R6 auth gating)", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  });

  test("wrong credentials are rejected with an error message", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(OPERATOR.email);
    await page.getByLabel("Password").fill("definitely-wrong-password");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Email or password did not match an active account.")).toBeVisible();
  });
});

test.describe("operator", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, OPERATOR);
  });

  test("overview groups/filters KPIs by category (R3.AC1)", async ({ page }) => {
    const filter = page.getByRole("group", { name: "Filter KPIs by category" });
    await expect(filter).toBeVisible();
    const allButton = filter.getByRole("button", { name: "All" });
    await expect(allButton).toHaveAttribute("aria-pressed", "true");

    const cardsBefore = await page.getByRole("article").count();
    expect(cardsBefore).toBeGreaterThan(1);

    const categoryButton = filter.getByRole("button", { name: "Empower People & Institutions" });
    await categoryButton.click();
    await expect(categoryButton).toHaveAttribute("aria-pressed", "true");
    await expect(allButton).toHaveAttribute("aria-pressed", "false");

    const cardsAfter = await page.getByRole("article").count();
    expect(cardsAfter).toBeLessThan(cardsBefore);
    for (const card of await page.getByRole("article").all()) {
      await expect(card.getByText("Empower People & Institutions")).toBeVisible();
    }
  });

  test("KPI with observations shows latest value, unit, region, date, review status (R3.AC2)", async ({
    page,
  }) => {
    const card = page.getByRole("article").filter({ hasText: TEST_KPI_NAME });
    await expect(card.getByText("47", { exact: false })).toBeVisible();
    await expect(card.getByText("percent").first()).toBeVisible();
    await expect(card.getByText("Ethiopia", { exact: true })).toBeVisible();
    await expect(card.getByText("Jun 30, 2026")).toBeVisible();
    await expect(card.getByText("45%")).toBeVisible(); // confidence
    await expect(card.getByText("Review flagged")).toBeVisible();
  });

  test("KPI without observations shows an empty state (R3.AC3)", async ({ page }) => {
    const emptyCard = page
      .getByRole("article")
      .filter({ hasText: "No observation" })
      .first();
    await expect(emptyCard).toBeVisible();
    await expect(emptyCard.getByText("Waiting for the first accepted observation.")).toBeVisible();
  });

  test("KPI detail shows history with traceability and flag distinction, no approve/reject (R4)", async ({
    page,
  }) => {
    await page
      .getByRole("article")
      .filter({ hasText: TEST_KPI_NAME })
      .getByRole("link", { name: "Open KPI detail" })
      .click();
    await expect(page.getByRole("heading", { name: TEST_KPI_NAME })).toBeVisible();

    // AC1: history table with both observations
    const history = page.getByRole("table");
    await expect(history).toBeVisible();
    const rows = history.locator("tbody tr");
    await expect(rows).toHaveCount(2);

    // AC2: per-observation source traceability
    const sourceLinks = history.getByRole("link", { name: "Source" });
    await expect(sourceLinks).toHaveCount(2);
    const hrefs = await sourceLinks.evaluateAll((links) =>
      links.map((a) => a.getAttribute("href")),
    );
    expect(hrefs).toContain("https://www.statsethiopia.gov.et/digital-economy-2026");
    expect(hrefs).toContain("https://www.worldbank.org/eth-digital-2025");

    // AC3: flagged vs auto-accepted visibly distinguished
    await expect(history.getByText("Review flagged")).toBeVisible();
    await expect(history.getByText("Auto accepted")).toBeVisible();

    // AC4: no approve/reject actions anywhere on the page
    await expect(page.getByRole("button", { name: /approve/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /reject/i })).toHaveCount(0);
    await expect(page.getByRole("link", { name: /approve|reject/i })).toHaveCount(0);
  });

  test("KPI admin lists definitions and shows all catalogue fields (R2.AC1, R2.AC4)", async ({
    page,
  }) => {
    await page.getByRole("navigation").getByRole("link", { name: "KPI Admin" }).click();
    await expect(page).toHaveURL(/\/admin\/kpis/);

    // AC1: existing definitions listed
    const list = page.getByRole("button", { name: new RegExp(TEST_KPI_NAME) });
    await expect(list).toBeVisible();

    // AC4: selecting a definition shows source URLs, target, unit, category, interval
    await list.click();
    await expect(page.getByLabel("Name")).toHaveValue(TEST_KPI_NAME);
    await expect(page.getByLabel("Category")).toHaveValue("Empower People & Institutions");
    await expect(page.getByLabel("Expected unit")).toHaveValue("percent");
    await expect(page.getByLabel("Target value")).toHaveValue("12");
    await expect(page.getByLabel("Fetch interval hours")).toHaveValue("24");
    await expect(page.getByLabel("Source URLs")).not.toHaveValue("");
  });

  test("KPI admin creates and edits definitions with persistence (R2.AC2, R2.AC3)", async ({
    page,
    request,
  }) => {
    await page.goto("/admin/kpis");

    // AC2: create captures the BRD-0001.R1 fields
    await page.getByRole("button", { name: "New", exact: true }).click();
    await page.getByLabel("Name").fill("VAL E2E temp KPI");
    await page.getByLabel("Category").fill("Validation");
    await page.getByLabel("Expected unit").fill("percent");
    await page.getByLabel("Target value").fill("99");
    await page.getByLabel("Fetch interval hours").fill("48");
    await page.getByLabel("Description").fill("Temporary KPI created by VAL-WO-0005 e2e");
    await page.getByLabel("Source URLs").fill("https://example.org/val-e2e");
    await page.getByRole("button", { name: "Create KPI" }).click();
    await expect(page.getByText("KPI definition saved.")).toBeVisible();

    // AC3: edit persists to the catalogue (survives a reload)
    await page.getByLabel("Description").fill("Temporary KPI edited by VAL-WO-0005 e2e");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("KPI definition saved.")).toBeVisible();

    await page.reload();
    await page.getByRole("button", { name: /VAL E2E temp KPI/ }).click();
    await expect(page.getByLabel("Description")).toHaveValue(
      "Temporary KPI edited by VAL-WO-0005 e2e",
    );

    // Cleanup: delete the temp KPI through the API using the browser session
    const kpiId = await page.evaluate(async () => {
      const res = await fetch("/api/kpis");
      const body = await res.json();
      const kpi = (body.kpis ?? body ?? []).find?.(
        (k: { name: string }) => k.name === "VAL E2E temp KPI",
      );
      return kpi?.id ?? null;
    });
    if (kpiId) {
      const cookies = await page.context().cookies();
      const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
      const del = await request.delete(`/api/kpis/${kpiId}`, {
        headers: { cookie: cookieHeader },
      });
      expect(del.ok()).toBeTruthy();
    }
  });

  test("pipeline status page renders for operator (R6.AC4)", async ({ page }) => {
    await page.getByRole("navigation").getByRole("link", { name: "Pipeline" }).click();
    await expect(page).toHaveURL(/\/pipeline/);
    await expect(page.getByRole("heading", { name: "Pipeline status" })).toBeVisible();
  });

  test("account page shows session basics and sign-out works (R6.AC5)", async ({ page }) => {
    await page.getByRole("navigation").getByRole("link", { name: "Account" }).click();
    await expect(page).toHaveURL(/\/account/);
    await expect(page.getByText(OPERATOR.email)).toBeVisible();
    await expect(page.getByText("OPERATOR").first()).toBeVisible();

    await page.getByRole("button", { name: /sign out/i }).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("viewer", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, VIEWER);
  });

  test("viewer nav hides operator pages; direct access is denied (R6.AC6)", async ({ page }) => {
    const nav = page.getByRole("navigation", { name: "Primary navigation" });
    await expect(nav.getByRole("link", { name: "Dashboard" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Account" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "KPI Admin" })).toHaveCount(0);
    await expect(nav.getByRole("link", { name: "Pipeline" })).toHaveCount(0);

    await page.goto("/admin/kpis");
    await expect(page).toHaveURL(/\/$|\/\?/);
    await page.goto("/pipeline");
    await expect(page).toHaveURL(/\/$|\/\?/);
  });

  test("viewer can read dashboard and KPI detail (R6.AC1, R6.AC2)", async ({ page }) => {
    await page
      .getByRole("article")
      .filter({ hasText: TEST_KPI_NAME })
      .getByRole("link", { name: "Open KPI detail" })
      .click();
    await expect(page.getByRole("heading", { name: TEST_KPI_NAME })).toBeVisible();
    await expect(page.getByRole("table")).toBeVisible();
    await expect(page.getByRole("button", { name: /approve|reject/i })).toHaveCount(0);
  });
});
