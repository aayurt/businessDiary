-- Drop the temporary publicPageGenerated column
ALTER TABLE "MdFile" DROP COLUMN IF EXISTS "publicPageGenerated";

-- Create PublicPage table
CREATE TABLE "PublicPage" (
    "id" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicPage_pkey" PRIMARY KEY ("id")
);

-- Add unique constraints
CREATE UNIQUE INDEX "PublicPage_fileId_key" ON "PublicPage"("fileId");
CREATE UNIQUE INDEX "PublicPage_slug_key" ON "PublicPage"("slug");

-- Add foreign key
ALTER TABLE "PublicPage" ADD CONSTRAINT "PublicPage_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "MdFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
