import { BadRequestException, Injectable } from '@nestjs/common';
import { User } from '@supabase/supabase-js';
import { UserProfileDto } from './dto/user-profile.dto';
import { FollowService } from '../follow/follow.service';
import { Logger } from 'nestjs-pino';
import { UserService } from '../../user/user.service';

/**
 * Service responsible for managing user profiles.
 */
@Injectable()
export class ProfileService {
  constructor(
    private readonly logger: Logger,
    private readonly userService: UserService,
    private readonly followService: FollowService,
  ) {}

  /**
   * Retrieves the profile data for a given user.
   *
   * @param {User} user - The user for whom the profile data is to be retrieved.
   * @param {string} userId - The optional user id
   * @return {Promise<UserProfileDto>} A promise that resolves to the user's profile data, including follow count.
   */
  async getProfile(user: User, userId?: string): Promise<UserProfileDto> {
    const user_identifier: string = userId ?? user.id;

    this.logger.debug(`ProfileService: Trying to get profile for ${user_identifier}`);

    const [userDto, followCount] = await Promise.all([
      this.userService.getUserById(user_identifier),
      this.followService.getCount(user),
    ]);

    if (!userDto) {
      this.logger.warn(`ProfileService: User ${user.id} not found`);
      throw new BadRequestException(`User ${user.id} not found`);
    }

    return { ...userDto, followers_count: followCount.followersCount, following_count: followCount.followingCount };
  }
}
