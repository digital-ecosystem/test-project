/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `otps` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."otps" ADD COLUMN     "blockedUntil" TIMESTAMP(3),
ADD COLUMN     "resendCount" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "otps_email_key" ON "public"."otps"("email");
