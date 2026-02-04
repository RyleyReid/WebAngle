-- Start fully clean: drop any existing tables (from old schema or partial apply)
DROP TABLE IF EXISTS "website_searches";
DROP TABLE IF EXISTS "websites";
DROP TABLE IF EXISTS "analysis_scores";
DROP TABLE IF EXISTS "analyses";

-- CreateTable: Websites (one per unique normalized URL)
CREATE TABLE "websites" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "name" TEXT,
    "emails" TEXT NOT NULL,
    "socialLinks" TEXT NOT NULL,
    "overallScore" INTEGER,
    "performanceScore" INTEGER,
    "styleScore" INTEGER,
    "responsiveScore" INTEGER,
    "contentScore" INTEGER,
    "analysisCount" INTEGER NOT NULL DEFAULT 1,
    "lastAnalyzedAt" DATETIME,
    "result" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Website_url_key" ON "websites"("url");

-- CreateTable: WebsiteSearches (one per user analysis run)
CREATE TABLE "website_searches" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "website_id" TEXT NOT NULL,
    "analysis_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "website_searches_website_id_fkey" FOREIGN KEY ("website_id") REFERENCES "websites" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "WebsiteSearch_userId_idx" ON "website_searches"("user_id");
CREATE INDEX "WebsiteSearch_websiteId_idx" ON "website_searches"("website_id");
CREATE INDEX "WebsiteSearch_userId_createdAt_idx" ON "website_searches"("user_id", "created_at");
