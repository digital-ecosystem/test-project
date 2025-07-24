/*
  Warnings:

  - Made the column `userId` on table `Session` required. This step will fail if there are existing NULL values in that column.
  - Made the column `expiresAt` on table `Session` required. This step will fail if there are existing NULL values in that column.
  - Made the column `token` on table `Session` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_userId_fkey";

-- AlterTable
ALTER TABLE "Session" ALTER COLUMN "userId" SET NOT NULL,
ALTER COLUMN "expiresAt" SET NOT NULL,
ALTER COLUMN "token" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
