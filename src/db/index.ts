import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function logQuery(
  chatId: number,
  input: string,
  response: string,
  tokenData: string
) {
  await prisma.queryLog.create({
    data: {
      chatId,
      input,
      response,
      tokenData,
    },
  });
}

export async function getRecentLogs(chatId: any) {
  const logs = await prisma.queryLog.findMany({
    where: { chatId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return logs;
}

export async function getLogList(input?: string, chatId?: number) {
  const logs = await prisma.queryLog.findMany({
    where: { input, chatId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return logs;
}
