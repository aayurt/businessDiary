-- CreateTable
CREATE TABLE "BudgetItem" (
    "id" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" TEXT NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BudgetItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeasibilityEntry" (
    "id" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "place" TEXT,
    "score" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeasibilityEntry_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BudgetItem" ADD CONSTRAINT "BudgetItem_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "MdFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetItem" ADD CONSTRAINT "BudgetItem_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeasibilityEntry" ADD CONSTRAINT "FeasibilityEntry_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "MdFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
