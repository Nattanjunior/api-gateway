import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import sensible from "@fastify/sensible";
import Fastify, { type FastifyError, type FastifyInstance } from "fastify";
import { env } from "@/config/env.js";
import { rateLimitPlugin } from '@/plugins/rateLimit.js'

export async function buildServer(): Promise<FastifyInstance> {
	const app = Fastify({
		logger: {
			level: env.LOG_LEVEL,
			...(env.NODE_ENV === "development" && {
				transport: {
					target: "pino-pretty",
					options: {
						colorize: true,
						translateTime: "HH:MM:ss",
						ignore: "pid,hostname",
					},
				},
			}),
		},
		genReqId: () => crypto.randomUUID(),
	});

	// ── Plugins de segurança e utilitários ───────────────────────────────────
	await app.register(helmet);
	await app.register(cors, {
		origin: env.NODE_ENV === "production" ? false : "*",
		methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
	});

  await app.register(sensible);
  
  
	await app.register(rateLimitPlugin)

	app.get("/health", async (_request, reply) => {
		return reply.send({
			status: "ok",
			timestamp: new Date().toISOString(),
			uptime: Math.floor(process.uptime()),
			environment: env.NODE_ENV,
		});
	});

	// ── Handler global de erros ───────────────────────────────────────────────
  app.setErrorHandler((error: FastifyError, request, reply) => {
    
		const statusCode = error.statusCode ?? 500;
		request.log.error(
			{ err: error, statusCode },
			"Erro não tratado na request",
		);

		const message =
			statusCode >= 500 && env.NODE_ENV === "production"
				? "Erro interno do servidor"
				: error.message;

		return reply.status(statusCode).send({
			error: error.name ?? "Error",
			message,
			statusCode,
		});
	});

	app.ready(() => {
		app.log.info("Servidor pronto para receber requests");
	});

	return app;
}
