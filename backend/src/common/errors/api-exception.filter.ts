import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { type Request, type Response } from 'express';

import { ApiException } from './api-exception';
import { COMMON_ERRORS } from './common-errors';

/**
 * Turns exceptions raised during HTTP requests into API responses.
 * ApiException constructs an error; this filter sends its status and JSON body.
 * Registered globally by configureApiBoundaries, so controllers do not need
 * their own try/catch just to format an error response.
 */
// No arguments means NestJS sends every exception type to this filter.
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  // The class name becomes the log context: ERROR [ApiExceptionFilter] ...
  private readonly logger = new Logger(ApiExceptionFilter.name);

  // NestJS calls this method with the thrown value and the current call context.
  // `unknown` requires us to check the thrown value before using it as an error.
  catch(exception: unknown, host: ArgumentsHost): void {
    // `host` is NestJS's container for the current call's arguments, not a server
    // hostname. It supports HTTP, WebSocket and microservice contexts.
    // This filter handles HTTP requests, so we select the HTTP accessors.
    // switchToHttp() does not change protocols or send another request.
    const http = host.switchToHttp();

    // Retrieve the existing Express objects for the request that failed.
    // response lets us send status/JSON; request tells us whether a route matched.
    // <Response> and <Request> describe the expected types to TypeScript;
    // they do not convert or validate these objects at runtime.
    const response = http.getResponse<Response>();
    const request = http.getRequest<Request>();

    // Each branch below assigns the HTTP error we will send to the client.
    let error: HttpException;

    // Check our subclass first: ApiException is also an HttpException.
    // It already contains an application code and safe response fields.
    if (exception instanceof ApiException) {
      error = exception;
    } else if (exception instanceof NotFoundException && !request.route) {
      // A 404 with no matched Express route means the address/method is unknown.
      // A controller's "resource not found" error must not get this routing code.
      error = new ApiException(COMMON_ERRORS.ROUTE_NOT_FOUND);
    } else if (exception instanceof HttpException) {
      // A deliberate HTTP error without an application code keeps its status.
      // This is the fallback until domain exceptions are migrated to ApiException.
      // Do not copy its message/details: they may contain internal information.
      error = new ApiException({
        ...COMMON_ERRORS.REQUEST_REJECTED,
        statusCode: exception.getStatus(),
      });
    } else {
      // An ordinary Error (or any other thrown value) becomes a safe HTTP 500.
      error = new ApiException(COMMON_ERRORS.INTERNAL_ERROR);
      // Arbitrary SDK errors can contain tokens, request bodies and credentials.
      // Keep a diagnostic category without serializing the original exception.
      this.logger.error('Unhandled API exception.');
    }

    // If the response has already started, we cannot replace its status or body.
    // Finish it and leave the method before attempting to send another response.
    if (response.headersSent) {
      response.end();
      return;
    }
    // Set the HTTP status, then send the error body as JSON. status() returns the
    // same response object, which allows the chained .json(...) call.
    response.status(error.getStatus()).json(error.getResponse());
  }
}
