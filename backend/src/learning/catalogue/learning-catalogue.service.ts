import { Injectable } from '@nestjs/common';
import { ApiException } from '../../common/errors/api-exception';
import type { VocabularyLevel } from '../../generated/prisma/enums';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CATALOGUE_LEARNING_LEVELS,
  DEFAULT_LEARNING_LEVEL,
  PUBLISHED_LEARNING_VARIANT,
} from '../constants';
import { LEARNING_ERRORS } from '../learning-errors';
import { DEFAULT_LEARNING_COVER_KEY } from '../media/constants';
import { getLearningMediaUrl } from '../media/utils/getLearningMediaUrl';
import { localizeLearningEntry } from '../utils/localizeLearningEntry';
import { orderLearningLevels } from '../utils/orderLearningLevels';
import type { GetLearningCatalogueDto } from './dto/get-learning-catalogue.dto';
import type { GetLearningCatalogueResponseDto } from './dto/get-learning-catalogue-response.dto';

type TopicIdentity = { id: string; parentId: string | null };
type LessonLevels = { topicId: string; variants: { level: VocabularyLevel }[] };

@Injectable()
export class LearningCatalogueService {
  constructor(private readonly prisma: PrismaService) {}

  /** Builds the localized catalogue for the requested topic or the root. */
  async getCatalogue(
    query: GetLearningCatalogueDto,
  ): Promise<GetLearningCatalogueResponseDto> {
    const { topics, lessons } = await this.loadPublishedCatalogue();
    const parent =
      query.topic === undefined
        ? null
        : topics.find((topic) => topic.slug === query.topic);
    if (query.topic !== undefined && !parent)
      throw new ApiException(LEARNING_ERRORS.NOT_FOUND);
    const summarizeTopic = (topic: (typeof topics)[number]) => ({
      slug: topic.slug,
      coverImageUrl:
        getLearningMediaUrl(topic.thumbnailImageKey) ??
        getLearningMediaUrl(topic.coverImageKey ?? DEFAULT_LEARNING_COVER_KEY),
      ...localizeLearningEntry(topic.translations, query.locale),
      availableLevels: this.topicLevels(topic.id, topics, lessons),
    });
    return {
      supportedLevels: [...CATALOGUE_LEARNING_LEVELS],
      defaultLevel: DEFAULT_LEARNING_LEVEL,
      topic: parent ? summarizeTopic(parent) : null,
      topics: topics
        .filter((topic) => topic.parentId === (parent?.id ?? null))
        .map(summarizeTopic)
        .filter((topic) => topic.availableLevels.length > 0),
      lessons: lessons
        .filter((lesson) => lesson.topicId === parent?.id)
        .map((lesson) => {
          const coverImageUrl = getLearningMediaUrl(
            parent?.coverImageKey ?? DEFAULT_LEARNING_COVER_KEY,
          );
          return {
            slug: lesson.slug,
            coverImageUrl,
            thumbnailUrl:
              getLearningMediaUrl(lesson.thumbnailImageKey) ??
              getLearningMediaUrl(parent?.thumbnailImageKey ?? null) ??
              coverImageUrl,
            ...localizeLearningEntry(lesson.translations, query.locale),
            availableLevels: orderLearningLevels(
              lesson.variants.map((variant) => variant.level),
            ),
          };
        }),
    };
  }

  /** Loads the catalogue entries visible through published topic ancestry and variants. */
  async loadPublishedCatalogue() {
    const [publishedTopics, storedLessons] = await Promise.all([
      this.prisma.learningTopic.findMany({
        where: { publishedAt: { not: null } },
        orderBy: [{ position: 'asc' }, { slug: 'asc' }],
        include: { translations: true },
      }),
      this.prisma.learningLesson.findMany({
        where: { variants: { some: PUBLISHED_LEARNING_VARIANT } },
        orderBy: [{ position: 'asc' }, { slug: 'asc' }],
        include: {
          translations: true,
          variants: {
            where: PUBLISHED_LEARNING_VARIANT,
            select: { level: true },
          },
        },
      }),
    ]);
    const topics = publishedTopics.filter((topic) =>
      this.visibleTopic(topic.id, publishedTopics),
    );
    const topicIds = new Set(topics.map((topic) => topic.id));
    return {
      topics,
      lessons: storedLessons.filter((lesson) => topicIds.has(lesson.topicId)),
    };
  }

  private visibleTopic(id: string, topics: TopicIdentity[]): boolean {
    const visited = new Set<string>();
    let next: string | null = id;
    while (next !== null) {
      if (visited.has(next)) return false;
      visited.add(next);
      const topic = topics.find((candidate) => candidate.id === next);
      if (!topic) return false;
      next = topic.parentId;
    }
    return true;
  }

  private topicLevels(
    id: string,
    topics: TopicIdentity[],
    lessons: LessonLevels[],
  ) {
    const descendants = new Set([id]);
    let added = true;
    while (added) {
      added = false;
      for (const topic of topics) {
        if (
          topic.parentId !== null &&
          descendants.has(topic.parentId) &&
          !descendants.has(topic.id)
        ) {
          descendants.add(topic.id);
          added = true;
        }
      }
    }
    return orderLearningLevels(
      lessons
        .filter((lesson) => descendants.has(lesson.topicId))
        .flatMap((lesson) => lesson.variants.map((variant) => variant.level)),
    );
  }
}
