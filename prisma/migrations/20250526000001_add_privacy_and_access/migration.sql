-- Create PrivacyMode enum
CREATE TYPE "PrivacyMode" AS ENUM ('PUBLIC', 'SHARED', 'PRIVATE');

-- Add privacy column to MdFile (nullable initially for data migration)
ALTER TABLE "MdFile" ADD COLUMN "privacy" "PrivacyMode";

-- Migrate existing data: published=true → PUBLIC, published=false → PRIVATE
UPDATE "MdFile" SET "privacy" = 'PUBLIC'::"PrivacyMode" WHERE "published" = true;
UPDATE "MdFile" SET "privacy" = 'PRIVATE'::"PrivacyMode" WHERE "published" = false;

-- Make privacy NOT NULL and set default
ALTER TABLE "MdFile" ALTER COLUMN "privacy" SET NOT NULL;
ALTER TABLE "MdFile" ALTER COLUMN "privacy" SET DEFAULT 'PRIVATE';

-- Drop the old published column
ALTER TABLE "MdFile" DROP COLUMN "published";

-- Create FileAccess table
CREATE TABLE "FileAccess" (
    "id" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FileAccess_pkey" PRIMARY KEY ("id")
);

-- Add unique constraint on (fileId, email)
CREATE UNIQUE INDEX "FileAccess_fileId_email_key" ON "FileAccess"("fileId", "email");

-- Add foreign keys
ALTER TABLE "FileAccess" ADD CONSTRAINT "FileAccess_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "MdFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FileAccess" ADD CONSTRAINT "FileAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
