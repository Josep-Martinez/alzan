import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { FollowCountDto } from '../../follow/dto/follow-count.dto';
import { Database } from '../../../../types/database.types';

export type UserRow = Database['public']['Tables']['users']['Row'];

export class UserProfileDto {
  id!: string;

  @ApiProperty()
  @Expose()
  username!: string;

  @ApiProperty({ required: false })
  @Expose()
  display_name?: string;

  @ApiProperty({ required: false })
  @Expose()
  avatar_url?: string;

  @ApiProperty()
  @Expose()
  followers_count!: number;

  @ApiProperty()
  @Expose()
  following_count!: number;

  static of(userData: UserRow, followCount: FollowCountDto): UserProfileDto {
    const userProfile = new UserProfileDto();

    userProfile.id = userData.id;
    userProfile.username = userData.username ?? '';
    userProfile.display_name = userData.display_name ?? '';
    userProfile.avatar_url = userData.avatar_url ?? '';
    userProfile.followers_count = followCount.followersCount;
    userProfile.following_count = followCount.followingCount;

    return userProfile;
  }
}
