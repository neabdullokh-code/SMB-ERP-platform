import type { FastifyInstance } from "fastify";
import { fail, isDocumentPostingError } from "../lib/envelope.js";

export async function errorHandlingPlugin(fastify: FastifyInstance) {
  fastify.setErrorHandler((error, request, reply) => {
    if (isDocumentPostingError(error)) {
      request.log.warn(
        { err: error, errorCode: error.errorCode, details: error.details },
        "Document posting rejected"
      );
      reply.status(error.httpStatus).send(fail(error.message, error.errorCode, error.details));
      return;
    }

    request.log.error(error);
    reply.status(500).send({
      message: "Internal server error",
      requestId: request.id
    });
  });
}
