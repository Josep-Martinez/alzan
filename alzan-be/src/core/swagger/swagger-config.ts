import { SwaggerApi } from './swagger-api.enum';

export interface ISwaggerConfiguration {
  endpoint: string;
  title: string;
  description: string;
}

export const SWAGGER_CONFIGURATIONS: Record<SwaggerApi, ISwaggerConfiguration> = {
  [SwaggerApi.USER_API]: {
    endpoint: 'api',
    title: 'Alzan API',
    description: 'Alzan Backend API',
  },
  [SwaggerApi.SOCIAL_API]: {
    endpoint: 'social',
    title: 'Social API',
    description: 'Social interactions API',
  },
};

export const getSwaggerConfig = (apiType: SwaggerApi): ISwaggerConfiguration => {
  return SWAGGER_CONFIGURATIONS[apiType];
};
