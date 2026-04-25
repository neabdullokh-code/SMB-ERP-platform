import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { fail, isDocumentPostingError } from "../lib/envelope.js";

async function errorHandlingPluginImpl(fastify: FastifyInstance) {
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

export const errorHandlingPlugin = fp(errorHandlingPluginImpl, { name: "error-handling" });
