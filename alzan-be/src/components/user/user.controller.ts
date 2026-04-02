import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '@supabase/supabase-js';
import { SupabaseUserAuth } from '../../core/guards/auth.decorator';
import { UserOutputDto } from './dto/user.output-dto';

@Controller('user')
@SupabaseUserAuth()
export class UserController {
  /**
   * Get current authenticated user
   */
  @Get()
  getCurrentUser(@CurrentUser() user: User): UserOutputDto {
    return user;
  }
}
