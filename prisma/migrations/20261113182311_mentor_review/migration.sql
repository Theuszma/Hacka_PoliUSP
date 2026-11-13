-- AlterTable
ALTER TABLE "SupportRequest" ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewerId" TEXT;

-- AddForeignKey
ALTER TABLE "SupportRequest" ADD CONSTRAINT "SupportRequest_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "Engineer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
