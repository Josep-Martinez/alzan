import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseClient, User } from '@supabase/supabase-js';
import { SupabaseService } from '../supabase/supabase.service';
import { UserRow } from '../social/profile/dto/user-profile.dto';

@Injectable()
export class UserService {
  private readonly supabase: SupabaseClient;

  constructor(private readonly supabaseService: SupabaseService) {
    this.supabase = this.supabaseService.serviceRole;
  }

  async getUser(token: string): Promise<User> {
    const { data, error } = await this.supabase.auth.getUser(token);

    if (error || !data.user) {
      throw new NotFoundException('User not found!');
    }

    return data.user;
  }

  async getUserById(id: string): Promise<UserRow | null> {
    const { data: user, error: userError } = await this.supabase.from('users').select('*').eq('id', id).single();

    if (userError || !user) {
      throw new NotFoundException('User not found!');
    }

    return user;
  }
}
