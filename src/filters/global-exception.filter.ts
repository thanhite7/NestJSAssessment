import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';

/**
 * Global exception filter that handles all unhandled exceptions
 * Provides consistent error responses across the application
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    // Handle HTTP exceptions
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const errorResponse = exceptionResponse as Record<string, unknown>;
        const msg = errorResponse['message'];
        if (msg != null) {
          if (Array.isArray(msg) && msg.length > 0) {
            const first = (msg as unknown[])[0];
            message = typeof first === 'string' ? first : String(first);
          } else if (typeof msg === 'string') {
            message = msg;
          } else {
            message = JSON.stringify(msg);
          }
        }
      } else {
        message = String(exceptionResponse);
      }
    }
    // Handle standard errors
    else if (exception instanceof Error) {
      message = exception.message;

      // Map specific error messages to HTTP status codes
      if (message.includes('not found') || message.includes('Not found')) {
        status = HttpStatus.NOT_FOUND;
      } else if (
        message.includes('Invalid email') ||
        message.includes('Validation') ||
        message.includes('invalid')
      ) {
        status = HttpStatus.BAD_REQUEST;
      }
    }

    // Log the error with context
    const errorLog = {
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      statusCode: status,
      message,
      stack: exception instanceof Error ? exception.stack : undefined,
    };

    const logLevel = Number(status) >= 500 ? 'error' : 'warn';
    const logMessage =
      Number(status) >= 500 ? 'Internal server error' : 'Client error';

    this.logger[logLevel](logMessage, errorLog);

    // Send consistent error response
    const errorResponse = {
      message,
      ...(process.env.NODE_ENV === 'development' && {
        timestamp: errorLog.timestamp,
        path: errorLog.path,
        statusCode: status,
      }),
    };

    response.status(status).json(errorResponse);
  }
}
