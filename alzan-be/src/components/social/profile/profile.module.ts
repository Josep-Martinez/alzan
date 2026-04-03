import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { FollowService } from '../follow/follow.service';
import { UserService } from '../../user/user.service';

@Module({
  controllers: [ProfileController],
  providers: [ProfileService, UserService, FollowService],
  exports: [ProfileService],
})
export class ProfileModule {}
