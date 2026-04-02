import {
  Injectable,
  CanActivate,
  UnauthorizedException,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';
import { Reflector } from '@nestjs/core';
import { Scope, SCOPES_KEY } from './auth.decorator';
import { UserService } from '../../components/user/user.service';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    private readonly userService: UserService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const validTokenTypes = this.reflector.getAllAndOverride<
      Scope[] | undefined
    >(SCOPES_KEY, [context.getHandler(), context.getClass()]);

    if (!validTokenTypes?.length) {
      throw new UnauthorizedException('Unauthorized!');
    }

    if (validTokenTypes.includes('PUBLIC')) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authHeader: string | undefined = request.headers['authorization'];
    const token = authHeader?.split?.('Bearer ')?.[1];

    if (!authHeader || !authHeader.startsWith('Bearer ') || !token) {
      throw new UnauthorizedException('Unauthorized!');
    }

    try {
      // Attach user to request object for use in controllers
      request.user = await this.userService.getUser(token);
      return true;
    } catch (error) {
      this.logger.error({
        err: error,
        message: 'Unexpected error occurred getting the user from the token',
      });
      throw new UnauthorizedException('Unauthorized!');
    }
  }
}
