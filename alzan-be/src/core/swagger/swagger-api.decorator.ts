import { SwaggerApi } from './swagger-api.enum';

export const SWAGGER_METADATA_KEY = Symbol('SWAGGER_METADATA_KEY');

export function Api(...apiTypes: SwaggerApi[]) {
  return (target: object): void => {
    Reflect.defineMetadata(SWAGGER_METADATA_KEY, apiTypes, target);
  };
}
