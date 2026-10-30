import { OutboundHttpModule } from '../http/outbound-http.module';
import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { QuizModule } from '../quiz/quiz.module';
import { ArticleFormulaRenderer } from './discovery/article-formula-renderer';
import { WikipediaArticlesService } from './discovery/wikipedia-articles.service';
import { AiStructuredOutputRunner } from './infrastructure/ai-structured-output.runner';
import { AiRateLimitCoordinator } from './infrastructure/ai-rate-limit.coordinator';
import { AiTelemetry } from './infrastructure/ai.telemetry';
import { AiTokenCounter } from './infrastructure/ai-token-counter';
import { GroqTextClient } from './infrastructure/groq-text.client';
import { ArticleLibraryService } from './library/article-library.service';
import { ArticleQuizService } from './quiz/article-quiz.service';
import { ArticleQuizPromptPlanner } from './quiz/article-quiz-prompt.planner';
import { ArticleQuizValidator } from './quiz/article-quiz.validator';
import { ArticleVocabularyQuizValidator } from './quiz/article-vocabulary-quiz.validator';
import { ArticleAdaptationService } from './transformation/article-adaptation.service';
import { ArticleContentProcessor } from './transformation/article-content.processor';
import { ArticlePromptFactory } from './transformation/article-prompt.factory';
import { ArticleSimplificationCache } from './transformation/article-simplification-cache';
import { ArticleTransformationChunkCache } from './transformation/article-transformation-chunk-cache';
import { ArticleTransformationValidator } from './transformation/article-transformation.validator';
import { ArticleTransformationPlanner } from './transformation/article-transformation.planner';
import { ArticlesController } from './articles.controller';
import { ArticlesService } from './articles.service';

@Module({
  imports: [OutboundHttpModule, AuthModule, QuizModule],
  controllers: [ArticlesController],
  providers: [
    ArticleAdaptationService,
    ArticleContentProcessor,
    ArticleFormulaRenderer,
    ArticleLibraryService,
    ArticlePromptFactory,
    ArticleQuizPromptPlanner,
    ArticleQuizService,
    ArticleQuizValidator,
    ArticleSimplificationCache,
    ArticleTransformationChunkCache,
    ArticleTransformationPlanner,
    ArticleTransformationValidator,
    ArticleVocabularyQuizValidator,
    AiRateLimitCoordinator,
    AiStructuredOutputRunner,
    AiTelemetry,
    AiTokenCounter,
    ArticlesService,
    GroqTextClient,
    WikipediaArticlesService,
  ],
})
export class ArticlesModule {}
