CREATE TABLE "curriculum_subtopics" (
    "id" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "canonicalSlug" TEXT,
    "canonicalTitle" TEXT,
    "canonicalProblemId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "curriculum_subtopics_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "curriculum_subtopics_topic_title_key" ON "curriculum_subtopics"("topic", "title");
CREATE INDEX "curriculum_subtopics_topic_sortOrder_idx" ON "curriculum_subtopics"("topic", "sortOrder");

ALTER TABLE "curriculum_subtopics" ADD CONSTRAINT "curriculum_subtopics_canonicalProblemId_fkey" FOREIGN KEY ("canonicalProblemId") REFERENCES "problems"("id") ON DELETE SET NULL ON UPDATE CASCADE;
