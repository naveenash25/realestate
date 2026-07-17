import { Module } from '@nestjs/common';
import { OwnersController } from './owners.controller';
import { OwnersService } from './owners.service';
import { PropertiesModule } from '../properties/properties.module';

@Module({
  imports: [PropertiesModule],
  controllers: [OwnersController],
  providers: [OwnersService],
  exports: [OwnersService],
})
export class OwnersModule {}
