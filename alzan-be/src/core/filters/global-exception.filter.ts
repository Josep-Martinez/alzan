import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { type Response, type Request } from 'express';

type ExpectedException = {
  err: unknown;
  stack: string;
  message: string;
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const {
      err,
      stack,
      message = 'Internal Server Error',
    } = exception as ExpectedException;

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    this.logger.error(
      {
        status,
        path: request.url,
        err,
        stack,
      },
      message,
    );

    response.status(status).json({
      statusCode: status,
      message,
    });
  }
}
