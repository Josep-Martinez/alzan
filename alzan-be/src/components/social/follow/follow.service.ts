import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseClient, User } from '@supabase/supabase-js';

import { Database } from 'src/types/database.types';

import { PaginationDto } from 'src/common/dto/pagination.dto';
import { SupabaseService } from 'src/core/supabase/supabase.service';
import { FollowResponseDto } from './dto/follow-response.dto';
import { FollowCountDto } from './dto/follow-count.dto';

@Injectable()
export class FollowService {
  private readonly logger = new Logger(FollowService.name);

  private supabase: SupabaseClient<Database>;

  constructor(private readonly supabaseService: SupabaseService) {
    this.supabase = this.supabaseService.client;
  }

  /**
   * Follows a user
   *
   * @param user The user who is going to follow
   * @param to The username that the user will follow
   */
  public async follow(user: User, to: string): Promise<void> {
    this.logger.debug(`FollowService: Trying to follow user ${to}`);

    if (user.user_metadata?.username === to) {
      throw new BadRequestException('You cannot follow yourself');
    }

    const { data: targetUser, error: findError } = await this.supabase
      .from('users')
      .select('id')
      .eq('username', to)
      .single();

    if (findError || !targetUser) {
      throw new NotFoundException(`User ${to} not found`, { cause: findError });
    }

    if (targetUser.id === user.id) {
      throw new BadRequestException('You cannot follow yourself');
    }

    const { error: insertError } = await this.supabase.from('social_follows').insert({
      id_follower: user.id,
      id_followed: targetUser.id,
    });

    if (insertError) {
      if (insertError.code === '23505') {
        // Unique violation
        throw new ConflictException(`You are already following ${to}`);
      }
      throw new InternalServerErrorException(insertError.message, { cause: insertError });
    }
  }

  /**
   * Unfollows a user
   *
   * @param user The user who is going to unfollow
   * @param to The username that the user will unfollow
   */
  public async unfollow(user: User, to: string): Promise<void> {
    this.logger.debug(`FollowService: Trying to unfollow user ${to}`);
    const { data: targetUser, error: findError } = await this.supabase
      .from('users')
      .select('id')
      .eq('username', to)
      .single();

    if (findError || !targetUser) {
      throw new NotFoundException(`User ${to} not found`, { cause: findError });
    }

    const { error: deleteError } = await this.supabase
      .from('social_follows')
      .delete()
      .eq('id_follower', user.id)
      .eq('id_followed', targetUser.id);

    if (deleteError) {
      throw new InternalServerErrorException(deleteError.message, { cause: deleteError });
    }
  }

  /**
   * Get followers of the user provided
   * @param userId
   * @returns
   */
  public async getFollowers(userId: string, pagination: PaginationDto): Promise<FollowResponseDto[]> {
    this.logger.debug(`FollowService: Trying to get followers for user ${userId}`);
    const { data, error } = await this.supabase
      .from('social_follows')
      .select(
        `
          id_follower,
          users!id_follower (
              id,
              username,
              display_name,
              avatar_url
          )
      `,
      )
      .eq('id_followed', userId)
      .range(pagination.offset || 0, (pagination.offset || 0) + (pagination.limit || 10) - 1);

    if (error) {
      throw new InternalServerErrorException(error.message, { cause: error });
    }

    return data?.map(item => item.users) ?? [];
  }

  /**
   * Get the list of users that the user provided is following
   * @param {string} userId the user id
   * @param {PaginationDto} pagination the pagination
   * @returns {Promise<any[]>} the list of users that the user provided is following
   */
  public async getFollowing(userId: string, pagination: PaginationDto) {
    this.logger.debug(`FollowService: Trying to get following for user ${userId}`);
    const { data, error } = await this.supabase
      .from('social_follows')
      .select(
        `
        id_followed,
        users:id_followed (
          id,
          username,
          display_name,
          avatar_url
        )
      `,
      )
      .eq('id_follower', userId)
      .range(pagination.offset || 0, (pagination.offset || 0) + (pagination.limit || 10) - 1);

    if (error) {
      throw new InternalServerErrorException(error.message, { cause: error });
    }

    return data?.map(item => item.users) ?? [];
  }

  /**
   * Retrieves the count of followers and following for a specified user.
   *
   * @param {User} user - The user for whom the follow count is being retrieved.
   * @return {Promise<FollowCountDto>} A Promise that resolves to an object containing the follower count and following count.
   */
  public async getCount(user: User): Promise<FollowCountDto> {
    this.logger.debug('FollowService: Trying to get follow count');
    const userId = user.id;
    const followers = await this.getFollowersCount(userId);
    const following = await this.getFollowingCount(userId);

    return {
      followersCount: followers,
      followingCount: following,
    };
  }

  // Get followers count from user id provided
  private async getFollowersCount(userId: string): Promise<number> {
    this.logger.debug(`FollowService: Trying to get followers count for user ${userId}`);
    const { data, error } = await this.supabase.from('social_follows').select('*').eq('id_followed', userId);
    if (error) {
      this.logger.warn(`FollowService: Error getting followers count: ${error.message}`);
      return 0;
    }
    return data?.length ?? 0;
  }

  // Get following count from user id provided
  private async getFollowingCount(userId: string): Promise<number> {
    this.logger.debug(`FollowService: Trying to get following count for user ${userId}`);
    const { data, error } = await this.supabase.from('social_follows').select('*').eq('id_follower', userId);
    if (error) {
      this.logger.warn(`FollowService: Error getting following count: ${error.message}`);
      return 0;
    }
    return data?.length ?? 0;
  }
}
