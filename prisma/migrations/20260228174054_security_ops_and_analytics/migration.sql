-- CreateTable
CREATE TABLE "EventView" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EventView_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SearchMetric" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "query" TEXT NOT NULL,
    "category" TEXT,
    "view" TEXT,
    "resultsCount" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "CategoryMetric" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "EventView_eventId_idx" ON "EventView"("eventId");
CREATE INDEX "EventView_createdAt_idx" ON "EventView"("createdAt");
CREATE INDEX "SearchMetric_query_idx" ON "SearchMetric"("query");
CREATE INDEX "SearchMetric_createdAt_idx" ON "SearchMetric"("createdAt");
CREATE INDEX "CategoryMetric_category_idx" ON "CategoryMetric"("category");
CREATE INDEX "CategoryMetric_createdAt_idx" ON "CategoryMetric"("createdAt");
