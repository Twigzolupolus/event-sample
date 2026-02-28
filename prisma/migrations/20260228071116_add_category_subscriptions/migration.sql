-- CreateTable
CREATE TABLE "CategorySubscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "CategorySubscription_category_idx" ON "CategorySubscription"("category");

-- CreateIndex
CREATE UNIQUE INDEX "CategorySubscription_email_category_key" ON "CategorySubscription"("email", "category");
