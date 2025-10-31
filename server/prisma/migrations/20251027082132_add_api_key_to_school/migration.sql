/*
  Warnings:

  - A unique constraint covering the columns `[api_key]` on the table `schools` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "schools" ADD COLUMN     "api_key" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "schools_api_key_key" ON "schools"("api_key");
