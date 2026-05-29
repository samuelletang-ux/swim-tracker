-- Add competitionId to SwimResult
ALTER TABLE "SwimResult" ADD COLUMN "competitionId" TEXT;

-- Create Competition table
CREATE TABLE "Competition" (
  "id"        TEXT NOT NULL PRIMARY KEY,
  "name"      TEXT NOT NULL,
  "date"      TEXT NOT NULL,
  "location"  TEXT,
  "notes"     TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create CompetitionEntry table
CREATE TABLE "CompetitionEntry" (
  "id"            TEXT NOT NULL PRIMARY KEY,
  "competitionId" TEXT NOT NULL,
  "swimmerId"     TEXT NOT NULL,
  "stroke"        TEXT NOT NULL,
  "distance"      INTEGER NOT NULL,
  "createdAt"     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CompetitionEntry_competitionId_fkey"
    FOREIGN KEY ("competitionId") REFERENCES "Competition" ("id") ON DELETE CASCADE,
  CONSTRAINT "CompetitionEntry_swimmerId_fkey"
    FOREIGN KEY ("swimmerId") REFERENCES "Swimmer" ("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "CompetitionEntry_competitionId_swimmerId_stroke_distance_key"
  ON "CompetitionEntry"("competitionId", "swimmerId", "stroke", "distance");

-- Foreign key on SwimResult.competitionId
CREATE INDEX "SwimResult_competitionId_idx" ON "SwimResult"("competitionId");
