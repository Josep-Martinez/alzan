import { ApiProperty } from '@nestjs/swagger';

export class FollowCountDto {
  @ApiProperty()
  followersCount!: number;

  @ApiProperty()
  followingCount!: number;
}