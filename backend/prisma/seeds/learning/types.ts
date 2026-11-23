export type LearningSeed = {
  topicId: string;
  lessonId: string;
  topicSlug: string;
  lessonSlug: string;
  variantId: string;
  coverImageKey: string;
  position: number;
  topicTranslations: { locale: string; title: string; description: string }[];
  lessonTranslations: { locale: string; title: string; description: string }[];
  readingTitle: string;
  readingParagraphs: string[];
  questions: {
    id: string;
    prompt: string;
    explanation: string;
    options: string[];
    correctOptionPosition: number;
  }[];
};
