import { Bot } from "grammy";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { PrismaClient } from "@prisma/client";
import {
  handleHelpCommand,
  handleStartCommand,
  handleTextMessage,
} from "./handlers";
import { getLogList } from "../db";

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN!);
const prisma = new PrismaClient();

bot.command("start", handleStartCommand);
bot.command("help", handleHelpCommand);
bot.on("message:text", handleTextMessage);

const fastify = Fastify({ logger: true });
fastify.register(cors, {
  origin: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
});

fastify.get("/health", async () => ({ status: "ok" }));

fastify.register(async (instance) => {
  instance.get("/", async (request) => {
    const { input, chatId } = request.query as {
      input?: string;
      chatId?: number;
    };
    return await getLogList(input, chatId);
  });
});

fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error);
  reply.status(500).send({ error: "Internal Server Error" });
});

export const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: "0.0.0.0" });
    fastify.log.info(`Server listening on 3000`);
    await bot.start();
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

process.once("SIGINT", async () => {
  bot.stop();
  await fastify.close();
  await prisma.$disconnect();
});
process.once("SIGTERM", async () => {
  bot.stop();
  await fastify.close();
  await prisma.$disconnect();
});
