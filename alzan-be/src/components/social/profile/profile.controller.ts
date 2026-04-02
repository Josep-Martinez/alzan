import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { User } from '@supabase/supabase-js';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { ProfileService } from './profile.service';
import { UserProfileDto } from './dto/user-profile.dto';
import { SupabaseUserAuth } from '../../../core/guards/auth.decorator';

@ApiTags('Social')
@Controller('social')
@SupabaseUserAuth()
export class ProfileController {
  constructor(
    private readonly logger: Logger,
    private readonly service: ProfileService,
  ) {}

  @Get('profile')
  async getProfile(@CurrentUser() user: User): Promise<UserProfileDto> {
    this.logger.debug(`Controller layer: trying to get profile for ${user.id}`);
    return this.service.getProfile(user);
  }

  @Get('profile/:userId')
  async getProfileFromId(@CurrentUser() user: User, @Param('userId') userId?: string): Promise<UserProfileDto> {
    this.logger.debug(`Controller layer: trying to get profile for ${userId}`);
    return this.service.getProfile(user, userId);
  }
}
