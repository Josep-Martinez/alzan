import { ValidationPipe, ValidationPipeOptions } from '@nestjs/common';

export const defaultValidationOptions: ValidationPipeOptions = {
  whitelist: true,
  forbidNonWhitelisted: true,
  forbidUnknownValues: true,
  transform: true,
};

export function createValidationPipe(
  options: ValidationPipeOptions = {},
): ValidationPipe {
  return new ValidationPipe({
    ...defaultValidationOptions,
    ...options,
  });
}
