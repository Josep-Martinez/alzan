import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { UserController } from './user.controller';
import { Api } from '../../core/swagger/swagger-api.decorator';
import { SwaggerApi } from '../../core/swagger/swagger-api.enum';

@Api(SwaggerApi.USER_API)
@Module({
  imports: [SupabaseModule],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
