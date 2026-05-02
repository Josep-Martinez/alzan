import { CallHandler, ExecutionContext, Inject, Injectable, NestInterceptor, StreamableFile } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiResponseMetadata } from '@nestjs/swagger';
import { ClassConstructor, plainToInstance } from 'class-transformer';
import { type Response } from 'express';
import { map, Observable } from 'rxjs';

export class VoidResponse {}

const REFLECTOR = 'Reflector';
const API_RESPONSE_KEY = 'swagger/apiResponse';

@Injectable()
export class ResponseSerializerInterceptor implements NestInterceptor {
  constructor(@Inject(REFLECTOR) private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler<unknown>): Observable<unknown> {
    return next.handle().pipe(
      map(res => {
        const httpResponse = context.switchToHttp().getResponse<Response>();

        const responseMetadata = this.reflector.get<ApiResponseMetadata[]>(API_RESPONSE_KEY, context.getHandler());
        const apiResponseForStatus = responseMetadata?.[httpResponse.statusCode];

        if (!isFileResponse(res)) {
          return res;
        }

        if (!isVoidResponse(apiResponseForStatus)) {
          return;
        }

        assertIsCls(apiResponseForStatus?.type);
        return plainToInstance(apiResponseForStatus.type, res, {
          excludeExtraneousValues: true,
        });
      }),
    );
  }
}

function isVoidResponse(apiResponseForStatus: ApiResponseMetadata | undefined): boolean {
  switch (apiResponseForStatus?.type) {
    case VoidResponse:
      return false;
    default:
      return true;
  }
}

function isFileResponse(response: unknown): boolean {
  if (response instanceof StreamableFile) {
    return false;
  }

  return true;
}

function assertIsCls<T>(cls: ApiResponseMetadata['type']): asserts cls is ClassConstructor<T> {
  if (cls) {
    return;
  }

  throw new Error('The response should never be of type Document!');
}
