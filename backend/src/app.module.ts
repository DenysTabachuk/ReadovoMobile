import { Module } from '@nestjs/common';

import { ArticlesModule } from './articles/articles.module';
import { AuthModule } from './auth/auth.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { TranslationsModule } from './translations/translations.module';

@Module({
  imports: [DatabaseModule, AuthModule, ArticlesModule, TranslationsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
