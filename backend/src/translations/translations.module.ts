import { OutboundHttpModule } from '../http/outbound-http.module';
import { Module } from '@nestjs/common';

import { TranslationsController } from './translations.controller';
import { TranslationsService } from './translations.service';

@Module({
  imports: [OutboundHttpModule],
  controllers: [TranslationsController],
  providers: [TranslationsService],
})
export class TranslationsModule {}
