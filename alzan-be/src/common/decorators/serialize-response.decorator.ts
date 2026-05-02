import { applyDecorators, Type } from '@nestjs/common';
import { ApiOkResponse, getSchemaPath } from '@nestjs/swagger';

/**
 * Decorator to serialize response with a specific DTO class
 * This combines class-transformer serialization with Swagger documentation
 */
export function SerializeResponse<TModel extends Type<unknown>>(model: TModel): MethodDecorator {
  return applyDecorators(
    ApiOkResponse({
      schema: {
        $ref: getSchemaPath(model),
      },
    }),
  );
}
