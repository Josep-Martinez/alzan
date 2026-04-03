import { Expose } from 'class-transformer';

export class FollowResponseDto {
  id!: string;

  @Expose()
  username!: string | null;

  @Expose()
  display_name!: string | null;

  @Expose()
  avatar_url!: string | null;
}
