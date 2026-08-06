import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Dependency guard for BRD-0001.N1.AC1 (operational simplicity), as revised by
 * D-0020: when running the MVP pipeline, the system shall avoid distributed
 * processing, vector databases, data warehouses, and paid data APIs other than
 * the LLM API and the configured fallback search-provider API. [WO-0012]
 *
 * The guard fails `npm test` if `package.json` (dependencies or
 * devDependencies) gains a package in a forbidden category. Matching is
 * token-based over the package name, so it is deliberately fail-loud: a rare
 * false positive (e.g. a benign package that happens to contain a flagged
 * token) is resolved by adding that exact package name to
 * ALLOWED_DEPENDENCIES below with a one-line rationale — never by weakening
 * the forbidden lists.
 */

/**
 * Exact package names that are explicitly permitted even if a token matches a
 * forbidden category. Per D-0020 the LLM API client and the configured
 * fallback search-provider client (Tavily, chosen in D-0007 behind a provider
 * abstraction) are the only sanctioned paid-API clients.
 */
const ALLOWED_DEPENDENCIES = new Set<string>([
  // LLM API client (stack decision D-0014; allowed by BRD-0001.N1.AC1 as revised by D-0020)
  "openai",
  // Fallback search-provider clients (D-0007, D-0020)
  "tavily",
  "@tavily/core",
]);

type ForbiddenCategory = {
  category: string;
  /** Lowercase tokens matched against the package name split on non-alphanumerics. */
  tokens: string[];
};

const FORBIDDEN_CATEGORIES: ForbiddenCategory[] = [
  {
    // BRD-0001.N1.AC1: "vector databases"
    category: "vector database",
    tokens: [
      "pinecone",
      "weaviate",
      "chromadb",
      "qdrant",
      "milvus",
      "milvus2", // @zilliz/milvus2-sdk-node (official Milvus JS client, VAL-WO-0012 F1)
      "zilliz",
      "pgvector",
      "faiss",
      "lancedb",
      "vectordb", // LanceDB's actual npm package name (VAL-WO-0012 F1)
      "vector", // e.g. @upstash/vector; benign hits go on the allowlist
      "vectra",
      "vespa",
      "marqo",
    ],
  },
  {
    // BRD-0001.N1.AC1: "distributed processing" (incl. streaming platforms,
    // cluster compute, and distributed job/workflow orchestrators)
    category: "distributed processing framework",
    tokens: [
      "kafka",
      "kafkajs",
      "rdkafka",
      "kinesis", // e.g. @aws-sdk/client-kinesis (managed streaming)
      "spark",
      "flink",
      "hadoop",
      "airflow",
      "temporal",
      "temporalio",
      "bull",
      "bullmq",
      "bee", // bee-queue
      "agenda",
      "celery",
      "amqplib",
      "rabbitmq",
      "zeromq",
      "nats",
      "pulsar",
      "dask",
    ],
  },
  {
    // BRD-0001.N1.AC1: "data warehouses"
    category: "data warehouse client",
    tokens: [
      "snowflake",
      "bigquery",
      "redshift",
      "clickhouse",
      "databricks",
      "teradata",
      "athena",
      "duckdb", // embedded OLAP — treated as warehouse-class for the MVP
    ],
  },
  {
    // BRD-0001.N1.AC1: "paid data APIs other than the LLM API and the
    // configured fallback search-provider API" (allowed clients live in
    // ALLOWED_DEPENDENCIES above)
    category: "paid data API client (other than LLM and search provider, D-0020)",
    tokens: [
      "serpapi",
      "newsapi",
      "scraperapi",
      "scrapingbee",
      "apify",
      "brightdata",
      "diffbot",
      "zenrows",
      "firecrawl", // e.g. @mendable/firecrawl-js
      "exa", // exa-js
      "serper",
      "crawlbase",
    ],
  },
];

type Violation = { dependency: string; category: string };

function tokenizePackageName(name: string) {
  return name
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

export function findForbiddenDependencies(dependencyNames: string[]): Violation[] {
  const violations: Violation[] = [];

  for (const dependency of dependencyNames) {
    if (ALLOWED_DEPENDENCIES.has(dependency.toLowerCase())) {
      continue;
    }

    const tokens = new Set(tokenizePackageName(dependency));
    for (const { category, tokens: forbiddenTokens } of FORBIDDEN_CATEGORIES) {
      if (forbiddenTokens.some((token) => tokens.has(token))) {
        violations.push({ dependency, category });
        break;
      }
    }
  }

  return violations;
}

function readManifestDependencyNames() {
  const manifestPath = join(process.cwd(), "package.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };

  return [
    ...Object.keys(manifest.dependencies ?? {}),
    ...Object.keys(manifest.devDependencies ?? {}),
  ];
}

describe("dependency guard (BRD-0001.N1.AC1, D-0020) [WO-0012]", () => {
  it("package.json contains no forbidden infrastructure dependencies", () => {
    const dependencyNames = readManifestDependencyNames();
    expect(dependencyNames.length).toBeGreaterThan(0);

    const violations = findForbiddenDependencies(dependencyNames);
    expect(
      violations,
      violations.map((violation) => `${violation.dependency} (${violation.category})`).join("; "),
    ).toEqual([]);
  });

  it("detects an injected package from each forbidden category", () => {
    const paidApiCategory = "paid data API client (other than LLM and search provider, D-0020)";
    // Real npm package names — the clients a developer would actually install
    // (VAL-WO-0012: idealized names alone give false assurance).
    const injected: Array<[string, string]> = [
      ["@pinecone-database/pinecone", "vector database"],
      ["chromadb", "vector database"],
      ["@zilliz/milvus2-sdk-node", "vector database"], // official Milvus client (F1)
      ["vectordb", "vector database"], // LanceDB (F1)
      ["@upstash/vector", "vector database"],
      ["kafkajs", "distributed processing framework"],
      ["node-rdkafka", "distributed processing framework"],
      ["@temporalio/client", "distributed processing framework"],
      ["@aws-sdk/client-kinesis", "distributed processing framework"],
      ["bee-queue", "distributed processing framework"],
      ["agenda", "distributed processing framework"],
      ["snowflake-sdk", "data warehouse client"],
      ["@google-cloud/bigquery", "data warehouse client"],
      ["@clickhouse/client", "data warehouse client"],
      ["duckdb", "data warehouse client"],
      ["serpapi", paidApiCategory],
      ["@mendable/firecrawl-js", paidApiCategory],
      ["exa-js", paidApiCategory],
      ["serper", paidApiCategory],
      ["crawlbase", paidApiCategory],
    ];

    for (const [dependency, category] of injected) {
      const violations = findForbiddenDependencies([...readManifestDependencyNames(), dependency]);
      expect(violations, `expected ${dependency} to be flagged`).toEqual([
        { dependency, category },
      ]);
    }
  });

  it("permits the sanctioned LLM and search-provider clients (D-0020)", () => {
    const violations = findForbiddenDependencies(["openai", "tavily", "@tavily/core"]);
    expect(violations).toEqual([]);
  });
});
