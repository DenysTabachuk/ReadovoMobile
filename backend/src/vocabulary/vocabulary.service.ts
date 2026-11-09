import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApiException } from '../common/errors/api-exception';
import { VOCABULARY_ERRORS } from './vocabulary-errors';
import { DEFAULT_VOCABULARY_CONTENT_LOCALE } from './constants';
import type { ListVocabularyLessonsDto } from './dto/list-vocabulary-lessons.dto';
import type { ListVocabularyLessonsResponseDto } from './dto/list-vocabulary-lessons-response.dto';
import type { GetVocabularyLessonResponseDto } from './dto/get-vocabulary-lesson-response.dto';

type Translation = { locale: string; title: string; description: string };

@Injectable()
export class VocabularyService {
  constructor(private readonly prisma: PrismaService) {}

  async listLessons({
    locale,
  }: ListVocabularyLessonsDto): Promise<ListVocabularyLessonsResponseDto> {
    const lessons = await this.prisma.vocabularyLesson.findMany({
      where: { publishedAt: { not: null } },
      orderBy: [{ level: 'asc' }, { slug: 'asc' }],
      include: {
        translations: true,
        _count: { select: { words: true, stages: true } },
      },
    });
    return {
      lessons: lessons.map((lesson) => ({
        id: lesson.id,
        slug: lesson.slug,
        level: lesson.level,
        ...this.localize(lesson.translations, locale),
        wordCount: lesson._count.words,
        stageCount: lesson._count.stages,
      })),
    };
  }

  async getLesson(
    slug: string,
    { locale }: ListVocabularyLessonsDto,
  ): Promise<GetVocabularyLessonResponseDto> {
    const lesson = await this.prisma.vocabularyLesson.findFirst({
      where: { slug, publishedAt: { not: null } },
      include: {
        translations: true,
        words: { orderBy: { id: 'asc' } },
        stages: {
          orderBy: { position: 'asc' },
          include: {
            translations: true,
            words: { orderBy: { position: 'asc' } },
            _count: { select: { exercises: true } },
          },
        },
      },
    });
    if (!lesson) throw new ApiException(VOCABULARY_ERRORS.LESSON_NOT_FOUND);
    return {
      id: lesson.id,
      slug: lesson.slug,
      level: lesson.level,
      ...this.localize(lesson.translations, locale),
      wordCount: lesson.words.length,
      stageCount: lesson.stages.length,
      words: lesson.words.map((word) => ({
        id: word.id,
        word: word.word,
        transcription: word.transcription,
        translationUk: word.translationUk,
        example: word.example,
        exampleTranslationUk: word.exampleTranslationUk,
        imageKey: word.imageKey,
        imageSourceUrl: word.imageSourceUrl,
        imageLicense: word.imageLicense,
        imageAttribution: word.imageAttribution,
      })),
      stages: lesson.stages.map((stage) => ({
        id: stage.id,
        position: stage.position,
        kind: stage.kind,
        ...this.localize(stage.translations, locale),
        wordIds: stage.words.map(({ wordId }) => wordId),
        exerciseCount: stage._count.exercises,
      })),
    };
  }

  private localize(translations: Translation[], locale: string) {
    const copy =
      translations.find((translation) => translation.locale === locale) ??
      translations.find(
        (translation) =>
          translation.locale === DEFAULT_VOCABULARY_CONTENT_LOCALE,
      );
    if (!copy || !copy.title.trim() || !copy.description.trim()) {
      throw new Error('Vocabulary content translation is missing.');
    }
    return { title: copy.title, description: copy.description };
  }
}
