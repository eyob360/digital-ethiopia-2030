ALTER TABLE "pipeline_locks"
  ADD COLUMN "run_id" TEXT,
  ADD COLUMN "branches_total" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "branches_completed" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "completed_branch_keys" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
