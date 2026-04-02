import { Module } from '@nestjs/common';
import { SupabaseModule } from 'src/components/supabase/supabase.module';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { FollowService } from '../follow/follow.service';
import { UserService } from '../../user/user.service';

@Module({
  imports: [SupabaseModule],
  controllers: [ProfileController],
  providers: [ProfileService, UserService, FollowService],
  exports: [ProfileService],
})
export class ProfileModule {}
