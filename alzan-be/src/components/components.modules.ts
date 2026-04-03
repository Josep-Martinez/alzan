import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { SocialModule } from './social/social.module';

@Module({
  imports: [UserModule, SocialModule],
  exports: [UserModule, SocialModule],
})
export class ComponentsModule {}
