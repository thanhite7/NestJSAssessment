import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

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
            message = String(msg);
          }
        }
      } else {
        message = String(exceptionResponse);
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    console.error('Exception caught:', exception);

    response.status(status).json({
      message,
    });
  }
}
