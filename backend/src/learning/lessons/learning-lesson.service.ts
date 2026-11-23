import { Injectable } from '@nestjs/common';
import { ApiException } from '../../common/errors/api-exception';
import type { VocabularyLevel } from '../../generated/prisma/enums';
import { PrismaService } from '../../prisma/prisma.service';
import { LearningCatalogueService } from '../catalogue/learning-catalogue.service';
import {
  CATALOGUE_LEARNING_LEVELS,
  PUBLISHED_LEARNING_VARIANT,
} from '../constants';
import { LEARNING_ERRORS } from '../learning-errors';
import {
  LearningReadingService,
  READING_QUESTION_INCLUDE,
  type LearningReadingVariant,
} from '../reading/learning-reading.service';
import { localizeLearningEntry } from '../utils/localizeLearningEntry';
import { orderLearningLevels } from '../utils/orderLearningLevels';
import { VocabularyPracticeService } from '../vocabulary/vocabulary-practice.service';
import type { GetLearningLessonDto } from './dto/get-learning-lesson.dto';
import type { GetLearningLessonResponseDto } from './dto/get-learning-lesson-response.dto';

@Injectable()
export class LearningLessonService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly catalogue: LearningCatalogueService,
    private readonly reading: LearningReadingService,
    private readonly vocabulary: VocabularyPracticeService,
  ) {}

  /** Assembles the localized lesson and its published content for the requested level. */
  async getLesson(
    slug: string,
    query: GetLearningLessonDto,
  ): Promise<GetLearningLessonResponseDto> {
    const { lesson, topic } = await this.resolvePublishedLesson(slug);
    const variant = await this.loadReadingVariant(lesson.id, query.level);
    return {
      slug: lesson.slug,
      coverImageKey: topic.coverImageKey,
      ...localizeLearningEntry(lesson.translations, query.locale),
      topicSlug: topic.slug,
      supportedLevels: [...CATALOGUE_LEARNING_LEVELS],
      availableLevels: orderLearningLevels(
        lesson.variants.map((candidate) => candidate.level),
      ),
      variant: variant ? await this.getVariantContent(variant) : null,
    };
  }

  /** Resolves a visible lesson variant and delegates grading to the reading service. */
  async checkReadingAnswer(
    slug: string,
    level: VocabularyLevel,
    questionId: string,
    optionId: string,
  ) {
    const { lesson } = await this.resolvePublishedLesson(slug);
    const variant = await this.loadReadingVariant(lesson.id, level);
    if (!variant) throw new ApiException(LEARNING_ERRORS.NOT_FOUND);
    return this.reading.checkAnswer(variant, questionId, optionId);
  }

  /** Resolves a visible lesson variant and delegates grading to the vocabulary service. */
  async checkVocabularyAnswer(
    slug: string,
    level: VocabularyLevel,
    exerciseId: string,
    optionId: string,
  ) {
    const { lesson } = await this.resolvePublishedLesson(slug);
    const variant = await this.prisma.learningLessonVariant.findFirst({
      where: { lessonId: lesson.id, level, ...PUBLISHED_LEARNING_VARIANT },
      select: { id: true },
    });
    if (!variant) throw new ApiException(LEARNING_ERRORS.NOT_FOUND);
    return this.vocabulary.checkAnswer(variant.id, exerciseId, optionId);
  }

  private async resolvePublishedLesson(slug: string) {
    const { topics, lessons } = await this.catalogue.loadPublishedCatalogue();
    const lesson = lessons.find((candidate) => candidate.slug === slug);
    const topic = topics.find((candidate) => candidate.id === lesson?.topicId);
    if (!lesson || !topic) throw new ApiException(LEARNING_ERRORS.NOT_FOUND);
    return { lesson, topic };
  }

  private loadReadingVariant(lessonId: string, level: VocabularyLevel) {
    return this.prisma.learningLessonVariant.findFirst({
      where: { lessonId, level, ...PUBLISHED_LEARNING_VARIANT },
      include: READING_QUESTION_INCLUDE,
    });
  }

  private async getVariantContent(variant: LearningReadingVariant) {
    const reading = this.reading.getContent(variant);
    return {
      level: variant.level,
      vocabulary: await this.vocabulary.getContent(variant.id),
      ...reading,
    };
  }
}
