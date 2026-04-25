import type { FastifyInstance } from "fastify";

export async function errorHandlingPlugin(fastify: FastifyInstance) {
  fastify.setErrorHandler((error, request, reply) => {
    request.log.error(error);
    reply.status(500).send({
      message: "Internal server error",
      requestId: request.id
    });
  });
}
