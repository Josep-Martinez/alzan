import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { AppOutputDto } from './common/dtos/app.output-dto';
import { PublicAuth } from './core/guards/auth.decorator';

@Controller()
@PublicAuth()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * Returns the application information
   */
  @Get()
  getHealth(): AppOutputDto {
    return this.appService.getHealth();
  }
}
