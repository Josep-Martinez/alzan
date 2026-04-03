import { Expose } from 'class-transformer';
import { Database } from '../../../../types/database.types';

export type UserRow = Database['public']['Tables']['users']['Row'];

export class UserProfileDto {
  @Expose()
  id!: string;

  @Expose()
  username!: string | null;

  @Expose()
  display_name?: string | null;

  @Expose()
  avatar_url?: string | null;

  @Expose()
  followers_count!: number;

  @Expose()
  following_count!: number;
}
