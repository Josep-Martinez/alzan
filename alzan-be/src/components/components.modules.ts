import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { SupabaseModule } from './supabase/supabase.module';
import { SocialModule } from './social/social.module';

@Module({
  imports: [UserModule, SocialModule, SupabaseModule],
  exports: [UserModule, SocialModule, SupabaseModule],
})
export class ComponentsModule {}
