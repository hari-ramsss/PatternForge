CREATE TABLE "problem_visual_diagrams" (
    "id" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "exampleId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "mermaid" TEXT NOT NULL,
    "visualData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "problem_visual_diagrams_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "problem_visual_diagrams_exampleId_key" ON "problem_visual_diagrams"("exampleId");
CREATE UNIQUE INDEX "problem_visual_diagrams_problemId_exampleId_key" ON "problem_visual_diagrams"("problemId", "exampleId");

ALTER TABLE "problem_visual_diagrams" ADD CONSTRAINT "problem_visual_diagrams_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "problem_visual_diagrams" ADD CONSTRAINT "problem_visual_diagrams_exampleId_fkey" FOREIGN KEY ("exampleId") REFERENCES "problem_examples"("id") ON DELETE CASCADE ON UPDATE CASCADE;
