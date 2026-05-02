import { createGcpLoggingPinoConfig } from '@google-cloud/pino-logging-gcp-config';
import { Params } from 'nestjs-pino';
import { NodeEnvironment } from '../common/enum/config.enum';

export const createLoggerConfig = (): Params => {
  return {
    pinoHttp: {
      ...(process.env.NODE_ENV === NodeEnvironment.LOCAL
        ? {
            level: 'debug',

            transport: {
              target: 'pino-pretty',
              options: {
                sync: true,
                colorize: true,
                singleLine: true,
                levelFirst: false,
                ignore: 'pid,hostname',
                translateTime: 'yyyy-mm-dd"T"HH:MM:ss.l',
              },
            },
            serializers: {
              req: (req: { method: string; url: string }): string => `${req.method} ${req.url}`,
              res: (res: { statusCode: number }) => `${res.statusCode}`,
              err: (err: Error): { message: string; stack?: string } => ({
                message: err.message,
                stack: err.stack?.split('\n').slice(0, 3).join('\n'),
              }),
            },
          }
        : createGcpLoggingPinoConfig({}, { level: 'debug' })),
      redact: ['req.headers.authorization', 'req.headers["x-api-key"]', 'req.query.token'],
    },
  };
};
