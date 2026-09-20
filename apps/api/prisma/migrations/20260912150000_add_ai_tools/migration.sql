ALTER TYPE "ContentType" ADD VALUE 'AI_TOOL';
CREATE TABLE "ai_tool_details" (
  "content_id" UUID NOT NULL,
  "website_url" TEXT NOT NULL,
  "vendor" TEXT NOT NULL,
  "platforms" TEXT[] NOT NULL,
  "scenarios" TEXT[] NOT NULL,
  "usage_guide" TEXT NOT NULL,
  "limitations" TEXT NOT NULL,
  "pricing_model" TEXT NOT NULL,
  CONSTRAINT "ai_tool_details_pkey" PRIMARY KEY ("content_id"),
  CONSTRAINT "ai_tool_details_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
