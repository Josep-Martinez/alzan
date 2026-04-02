import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { SupabaseModule } from './supabase/supabase.module';

@Module({
  imports: [UserModule, SupabaseModule],
  exports: [UserModule, SupabaseModule],
})
export class ComponentsModule {}
