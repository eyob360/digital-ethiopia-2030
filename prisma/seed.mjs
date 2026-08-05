import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { randomBytes, scrypt } from "node:crypto";
import { promisify } from "node:util";

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5432/digital_ethiopia_2030?schema=public";

const adapter = new PrismaPg({
  connectionString: databaseUrl,
});

const prisma = new PrismaClient({ adapter });
const scryptAsync = promisify(scrypt);

async function createPasswordHash(password) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = await scryptAsync(password, salt, 64);

  return `scrypt:${salt}:${derivedKey.toString("hex")}`;
}

const kpis = [
  {
    name: "Digital economy share of GDP",
    description: "Share of Ethiopia's GDP attributed to the digital economy.",
    expectedUnit: "percent",
    targetValue: "12",
    category: "Empower People & Institutions",
    sourceUrls: ["https://www.digitalethiopia.tech/"],
  },
  {
    name: "Digital jobs (ICT/BPO/tech)",
    description: "Jobs created in ICT, BPO, and technology-enabled services.",
    expectedUnit: "jobs",
    targetValue: "1000000",
    category: "Empower People & Institutions",
    sourceUrls: ["https://www.digitalethiopia.tech/"],
  },
  {
    name: "Digital exports",
    description: "Export revenue from digital and digitally enabled services.",
    expectedUnit: "USD",
    targetValue: "3000000000",
    category: "Empower People & Institutions",
    sourceUrls: ["https://www.digitalethiopia.tech/"],
  },
  {
    name: "Basic certifications (5M Coders)",
    description: "Enrollment or certification count for the 5 Million Ethiopian Coders initiative.",
    expectedUnit: "enrollments/certifications",
    targetValue: "5000000",
    category: "Accelerate Inclusive Digital Economic Growth",
    sourceUrls: [
      "https://www.digitalethiopia.tech/",
      "https://www.gcs.gov.et/en/2026/06/11/%F0%9D%90%8E%F0%9D%90%8D%F0%9D%90%86%F0%9D%90%91%F0%9D%90%80%F0%9D%90%93%F0%9D%90%94%F0%9D%90%8B%F0%9D%90%80%F0%9D%90%93%F0%9D%90%88%F0%9D%90%8E%F0%9D%90%8D%F0%9D%90%92-%F0%9D%90%85%F0%9D%90%84/",
    ],
  },
  {
    name: "Fayda digital ID registrations",
    description: "Residents registered for Ethiopia's Fayda digital identification system.",
    expectedUnit: "registrations",
    targetValue: "90000000",
    category: "Cross-Cutting",
    sourceUrls: ["https://id.gov.et/strategies", "https://www.id.gov.et/worldbank"],
  },
  {
    name: "Internet penetration",
    description:
      "Share of the population using or covered by internet access, depending on source definition.",
    expectedUnit: "percent",
    category: "Achieve Universal Digital Access",
    sourceUrls: ["https://www.digitalethiopia.tech/"],
  },
  {
    name: "G2C services available online",
    description: "Government-to-citizen services available online.",
    expectedUnit: "services",
    category: "Achieve Universal Digital Access",
    sourceUrls: ["https://www.digitalethiopia.tech/"],
  },
  {
    name: "4G mobile broadband coverage",
    description:
      "Share of population or geography covered by 4G mobile broadband, depending on source definition.",
    expectedUnit: "percent",
    category: "Achieve Universal Digital Access",
    sourceUrls: ["https://www.digitalethiopia.tech/"],
  },
  {
    name: "Digital FDI inflows",
    description: "Foreign direct investment inflows into digital sectors.",
    expectedUnit: "USD",
    category: "Position Ethiopia for Digital FDI",
    sourceUrls: ["https://www.digitalethiopia.tech/"],
  },
  {
    name: "Global hyperscalers",
    description: "Count of global hyperscale cloud or infrastructure providers active in Ethiopia.",
    expectedUnit: "providers",
    category: "Position Ethiopia for Digital FDI",
    sourceUrls: ["https://www.digitalethiopia.tech/"],
  },
];

for (const kpi of kpis) {
  await prisma.kpiDefinition.upsert({
    where: { name: kpi.name },
    update: kpi,
    create: kpi,
  });
}

await prisma.pipelineLock.upsert({
  where: { name: "INGESTION" },
  update: { locked: false, lockedAt: null },
  create: { name: "INGESTION", locked: false },
});

const operatorPassword = process.env.SEED_OPERATOR_PASSWORD;
if (operatorPassword) {
  await prisma.user.upsert({
    where: { email: "operator@example.local" },
    update: { role: "OPERATOR" },
    create: {
      email: "operator@example.local",
      name: "Local Operator",
      passwordHash: await createPasswordHash(operatorPassword),
      role: "OPERATOR",
    },
  });
}

await prisma.$disconnect();
