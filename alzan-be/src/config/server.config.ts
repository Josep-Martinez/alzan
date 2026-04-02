import { registerAs } from '@nestjs/config';
import { ConfigNamespace, NodeEnvironment } from '../common/enum/config.enum';

export default registerAs(ConfigNamespace.SERVER, () => {
  return {
    port: parseInt(process.env.PORT ?? '', 10) || 1111,
    environment:
      (process.env.NODE_ENV as NodeEnvironment) ?? NodeEnvironment.DEVELOPMENT,
    cors: {
      origin: process.env.CORS_ORIGIN?.split(',') ?? '*',
      allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Accept',
        'Content-Type',
        'Authorization',
      ],
      methods: ['GET', 'PUT', 'OPTIONS', 'POST', 'PATCH', 'DELETE'],
    },
    baseUrl: process.env.BASE_URL || 'http://localhost:1111',
    frontendBaseUrl: process.env.FRONTEND_BASE_URL || 'http://localhost:3000',
  };
});
