import { Inject, Injectable } from '@nestjs/common';
import supabaseConfig from '../../config/supabase.config';
import { ConfigType } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly _supabase: SupabaseClient;

  constructor(
    @Inject(supabaseConfig.KEY)
    private readonly supabaseConfigurations: ConfigType<typeof supabaseConfig>,
  ) {
    const { supabaseUrl, supabaseServiceRoleKey } = this.supabaseConfigurations;
    this._supabase = createClient(supabaseUrl!, supabaseServiceRoleKey!);
  }

  get serviceRole(): SupabaseClient {
    return this._supabase;
  }
}
