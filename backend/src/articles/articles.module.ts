import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { ArticleFormulaRenderer } from './discovery/article-formula-renderer';
import { WikipediaArticlesService } from './discovery/wikipedia-articles.service';
import { GroqTextClient } from './infrastructure/groq-text.client';
import { ArticleLibraryService } from './library/article-library.service';
import { ArticleQuizService } from './quiz/article-quiz.service';
import { ArticleQuizResponseParser } from './quiz/article-quiz-response-parser';
import { ArticleVocabularyQuizResponseParser } from './quiz/article-vocabulary-quiz-response-parser';
import { ArticleAdaptationService } from './transformation/article-adaptation.service';
import { ArticleAdaptationResponseParser } from './transformation/article-adaptation-response-parser';
import { ArticleContentProcessor } from './transformation/article-content.processor';
import { ArticlePromptFactory } from './transformation/article-prompt.factory';
import { ArticleSimplificationCache } from './transformation/article-simplification-cache';
import { ArticlesController } from './articles.controller';
import { ArticlesService } from './articles.service';

@Module({
  imports: [AuthModule],
  controllers: [ArticlesController],
  providers: [
    ArticleAdaptationResponseParser,
    ArticleAdaptationService,
    ArticleContentProcessor,
    ArticleFormulaRenderer,
    ArticleLibraryService,
    ArticlePromptFactory,
    ArticleQuizResponseParser,
    ArticleQuizService,
    ArticleSimplificationCache,
    ArticleVocabularyQuizResponseParser,
    ArticlesService,
    GroqTextClient,
    WikipediaArticlesService,
  ],
})
export class ArticlesModule {}
