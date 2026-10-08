ALTER TABLE "problems" ADD COLUMN "createdById" TEXT;

CREATE INDEX "problems_createdById_source_idx" ON "problems"("createdById", "source");

ALTER TABLE "problems" ADD CONSTRAINT "problems_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;