CREATE TYPE "CurriculumProblemRole" AS ENUM ('CANONICAL_SEED', 'GENERATED');

ALTER TABLE "curriculum_subtopics" ADD COLUMN "topicKey" TEXT NOT NULL DEFAULT '';
UPDATE "curriculum_subtopics"
SET "topicKey" = CASE
    WHEN lower("topic") = 'advanced patterns & sums' THEN 'advanced-patterns'
    WHEN lower("topic") = 'queue / deque' THEN 'queue-deque'
    WHEN lower("topic") = 'linked list' THEN 'linked-list'
    WHEN lower("topic") = 'prefix sum' THEN 'prefix-sum'
    WHEN lower("topic") = 'two pointers' THEN 'two-pointers'
    WHEN lower("topic") = 'binary search' THEN 'binary-search'
    WHEN lower("topic") = 'sliding window' THEN 'sliding-window'
    WHEN lower("topic") = 'union find' THEN 'union-find'
    WHEN lower("topic") = 'dynamic programming' THEN 'dynamic-programming'
    WHEN lower("topic") = 'bit manipulation' THEN 'bit-manipulation'
    ELSE regexp_replace(lower("topic"), '[^a-z0-9]+', '-', 'g')
END;
DROP INDEX "curriculum_subtopics_topic_title_key";
CREATE UNIQUE INDEX "curriculum_subtopics_topicKey_title_key" ON "curriculum_subtopics"("topicKey", "title");
DROP INDEX "curriculum_subtopics_topic_sortOrder_idx";
CREATE INDEX "curriculum_subtopics_topicKey_sortOrder_idx" ON "curriculum_subtopics"("topicKey", "sortOrder");

CREATE TABLE "curriculum_problem_assignments" (
    "id" TEXT NOT NULL,
    "curriculumSubtopicId" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "role" "CurriculumProblemRole" NOT NULL DEFAULT 'CANONICAL_SEED',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "curriculum_problem_assignments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "curriculum_problem_assignments_curriculumSubtopicId_problemId_key" ON "curriculum_problem_assignments"("curriculumSubtopicId", "problemId");
CREATE INDEX "curriculum_problem_assignments_problemId_idx" ON "curriculum_problem_assignments"("problemId");

ALTER TABLE "curriculum_problem_assignments" ADD CONSTRAINT "curriculum_problem_assignments_curriculumSubtopicId_fkey" FOREIGN KEY ("curriculumSubtopicId") REFERENCES "curriculum_subtopics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "curriculum_problem_assignments" ADD CONSTRAINT "curriculum_problem_assignments_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;
