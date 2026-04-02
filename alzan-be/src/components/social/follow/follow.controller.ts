import { Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { User } from '@supabase/supabase-js';
import { Logger } from 'nestjs-pino';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { SupabaseUserAuth } from 'src/core/guards/auth.decorator';
import { FollowService } from './follow.service';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { VoidResponse } from 'src/core/interceptors/response-serializer.interceptor';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { FollowResponseDto } from './dto/follow-response.dto';

@ApiTags('Social')
@Controller('social')
@SupabaseUserAuth()
export class FollowController {
  constructor(
    private readonly logger: Logger,
    private readonly service: FollowService,
  ) {}

  /**
   * Follow a user
   * @param user
   * @param username
   */
  @Post('follow/:username')
  @HttpCode(HttpStatus.NO_CONTENT)
  async followUser(@CurrentUser() user: User, @Param('username') username: string): Promise<void> {
    this.logger.debug(`Controller layer: trying to follow user ${username}`, user.id);
    return this.service.follow(user, username);
  }

  /**
   * Unfollow a user
   * @param user
   * @param username
   */
  @Delete('follow/:username')
  @ApiOkResponse({ type: VoidResponse })
  async unfollowUser(@CurrentUser() user: User, @Param('username') username: string): Promise<void> {
    this.logger.debug(`Controller layer: trying to unfollow user ${username}`, user.id);
    return this.service.unfollow(user, username);
  }

  /**
   * Get followers of the user provided
   * @param userId
   * @param pagination
   */
  @Get('followers/:userId')
  @ApiOkResponse({ type: FollowResponseDto, isArray: true })
  async getFollowers(
    @Param('userId') userId: string,
    @Query() pagination: PaginationDto,
  ): Promise<FollowResponseDto[]> {
    this.logger.debug(`Controller layer: trying to get followers for ${userId}`);
    return this.service.getFollowers(userId, pagination);
  }

  /**
   * Get following of the user provided
   * @param userId
   * @param pagination
   */
  @Get('following/:userId')
  @ApiOkResponse({ type: FollowResponseDto, isArray: true })
  async getFollowing(
    @Param('userId') userId: string,
    @Query() pagination: PaginationDto,
  ): Promise<FollowResponseDto[]> {
    this.logger.debug(`Controller layer: trying to get following for ${userId}`);
    return this.service.getFollowing(userId, pagination);
  }
}
