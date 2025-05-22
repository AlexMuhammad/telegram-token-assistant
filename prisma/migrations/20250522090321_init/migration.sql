-- CreateTable
CREATE TABLE "QueryLog" (
    "id" SERIAL NOT NULL,
    "chatId" INTEGER NOT NULL,
    "input" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "tokenData" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QueryLog_pkey" PRIMARY KEY ("id")
);
