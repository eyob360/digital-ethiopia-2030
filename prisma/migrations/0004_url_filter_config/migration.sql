-- CreateTable
CREATE TABLE "url_filter_configs" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "blocked_domains" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "allowed_domains" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "url_filter_configs_pkey" PRIMARY KEY ("id")
);
