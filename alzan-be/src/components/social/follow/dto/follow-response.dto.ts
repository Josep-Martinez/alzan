import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class FollowResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  @Expose()
  username!: string;

  @ApiProperty({ required: false })
  @Expose()
  displayName!: string;

  @ApiProperty({ required: false })
  @Expose()
  avatarUrl?: string;
}
