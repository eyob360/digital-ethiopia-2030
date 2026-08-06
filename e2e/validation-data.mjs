// Validation data for the e2e suite (VAL-WO-0005 re-validation).
// Creates a viewer test user and two test observations (one auto-accepted,
// one review-flagged) on the seeded "Digital economy share of GDP" KPI.
//
//   node e2e/validation-data.mjs setup
//   node e2e/validation-data.mjs teardown
//
// The operator user comes from `SEED_OPERATOR_PASSWORD=... npm run db:seed`.
// Teardown removes the test observations, document, and both test users.
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { randomBytes, scrypt } from "node:crypto";
import { promisify } from "node:util";

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5432/digital_ethiopia_2030?schema=public";
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
const scryptAsync = promisify(scrypt);

const VIEWER_EMAIL = "viewer@example.local";
const VIEWER_PASSWORD = process.env.E2E_VIEWER_PASSWORD ?? "ValViewer2026!x";
const DOC_HASH = "val-wo-0005-revalidation-doc";
const TEST_KPI_NAME = "Digital economy share of GDP";

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = await scryptAsync(password, salt, 64);
  return `scrypt:${salt}:${derivedKey.toString("hex")}`;
}

const mode = process.argv[2] ?? "setup";

if (mode === "setup") {
  await prisma.user.upsert({
    where: { email: VIEWER_EMAIL },
    update: { role: "VIEWER", passwordHash: await hashPassword(VIEWER_PASSWORD) },
    create: {
      email: VIEWER_EMAIL,
      name: "Local Viewer",
      passwordHash: await hashPassword(VIEWER_PASSWORD),
      role: "VIEWER",
    },
  });

  const kpi = await prisma.kpiDefinition.findFirst({ where: { name: TEST_KPI_NAME } });
  if (!kpi) throw new Error(`Seeded KPI "${TEST_KPI_NAME}" not found — run npm run db:seed first`);

  const doc = await prisma.rawDocument.upsert({
    where: { contentHash: DOC_HASH },
    update: {},
    create: {
      sourceUrl: "https://www.statsethiopia.gov.et/digital-economy-2026",
      rawText: "Validation test document",
      contentHash: DOC_HASH,
    },
  });

  await prisma.kpiObservation.deleteMany({
    where: { explanation: { startsWith: "VAL-WO-0005" } },
  });
  // Explicit createdAt values: the dashboard's "latest" is createdAt-desc, so
  // the review-flagged observation must be strictly newer.
  await prisma.kpiObservation.createMany({
    data: [
      {
        kpiId: kpi.id,
        rawDocumentId: doc.id,
        value: "43",
        unit: "percent",
        region: "Ethiopia",
        observedDate: new Date("2025-11-30"),
        sourceUrl: "https://www.worldbank.org/eth-digital-2025",
        aiConfidence: "0.910",
        reviewFlag: false,
        explanation: "VAL-WO-0005 auto-accepted test observation",
        createdAt: new Date("2026-01-01T00:00:00Z"),
      },
      {
        kpiId: kpi.id,
        rawDocumentId: doc.id,
        value: "47",
        unit: "percent",
        region: "Ethiopia",
        observedDate: new Date("2026-06-30"),
        sourceUrl: "https://www.statsethiopia.gov.et/digital-economy-2026",
        aiConfidence: "0.450",
        reviewFlag: true,
        explanation: "VAL-WO-0005 review-flagged test observation",
        createdAt: new Date("2026-07-01T00:00:00Z"),
      },
    ],
  });
  console.log("e2e validation data ready; kpi id:", kpi.id);
} else if (mode === "teardown") {
  await prisma.kpiObservation.deleteMany({
    where: { explanation: { startsWith: "VAL-WO-0005" } },
  });
  await prisma.rawDocument.deleteMany({ where: { contentHash: DOC_HASH } });
  await prisma.kpiDefinition.deleteMany({ where: { name: { startsWith: "VAL E2E" } } });
  await prisma.user.deleteMany({
    where: { email: { in: [VIEWER_EMAIL, "operator@example.local"] } },
  });
  console.log("e2e validation data removed");
} else {
  throw new Error(`Unknown mode "${mode}" — use setup or teardown`);
}

await prisma.$disconnect();
