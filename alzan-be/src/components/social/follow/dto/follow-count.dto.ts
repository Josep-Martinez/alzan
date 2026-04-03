import { Expose } from 'class-transformer';

export class FollowCountDto {
  @Expose()
  followersCount!: number;

  @Expose()
  followingCount!: number;
}
