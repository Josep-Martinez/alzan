import { Module } from '@nestjs/common';
import { FollowModule } from './follow/follow.module';
import { ProfileModule } from './profile/profile.module';

@Module({
  imports: [FollowModule, ProfileModule],
  exports: [FollowModule, ProfileModule],
})
export class SocialModule {}
