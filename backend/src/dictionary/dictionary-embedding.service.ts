import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import * as tf from '@tensorflow/tfjs';
import * as use from '@tensorflow-models/universal-sentence-encoder';

@Injectable()
export class DictionaryEmbeddingService implements OnModuleInit {
  private readonly embeddingCache = new Map<string, number[]>();
  private readonly logger = new Logger(DictionaryEmbeddingService.name);
  private model?: use.UniversalSentenceEncoder;
  private modelPromise?: Promise<use.UniversalSentenceEncoder>;

  async onModuleInit(): Promise<void> {
    await this.loadModel();
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const normalizedText = this.normalizeText(text);
    const cachedEmbedding = this.embeddingCache.get(normalizedText);

    if (cachedEmbedding) {
      return cachedEmbedding;
    }

    const model = await this.loadModel();
    const embeddings = await model.embed([normalizedText]);
    const embeddingMatrix = await embeddings.array();
    embeddings.dispose();

    const embedding = embeddingMatrix[0];
    this.embeddingCache.set(normalizedText, embedding);

    return embedding;
  }

  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length || a.length === 0) {
      throw new BadRequestException(
        'Embeddings must be non-empty arrays of the same length.',
      );
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let index = 0; index < a.length; index += 1) {
      dotProduct += a[index] * b[index];
      normA += a[index] * a[index];
      normB += b[index] * b[index];
    }

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  async getSimilarWords(word: string, wordList: string[]): Promise<string[]> {
    const normalizedWord = this.normalizeText(word);
    const candidateWords = this.getUniqueWords(wordList).filter(
      (candidateWord) => candidateWord !== normalizedWord,
    );

    if (candidateWords.length === 0) {
      return [];
    }

    const targetEmbedding = await this.generateEmbedding(normalizedWord);
    const scoredWords = await Promise.all(
      candidateWords.map(async (candidateWord) => {
        const candidateEmbedding = await this.generateEmbedding(candidateWord);

        return {
          similarity: this.cosineSimilarity(
            targetEmbedding,
            candidateEmbedding,
          ),
          word: candidateWord,
        };
      }),
    );

    return scoredWords
      .sort((first, second) => second.similarity - first.similarity)
      .slice(0, 3)
      .map((scoredWord) => scoredWord.word);
  }

  async generateQuizOptions(
    correctWord: string,
    wordList: string[],
  ): Promise<string[]> {
    const normalizedCorrectWord = this.normalizeText(correctWord);
    const distractors = await this.getSimilarWords(
      normalizedCorrectWord,
      wordList,
    );

    if (distractors.length < 3) {
      throw new BadRequestException(
        'At least 3 distractor words are required.',
      );
    }

    return this.shuffleWords([normalizedCorrectWord, ...distractors]);
  }

  private async loadModel(): Promise<use.UniversalSentenceEncoder> {
    if (this.model) {
      return this.model;
    }

    if (!this.modelPromise) {
      this.logger.log('Loading Universal Sentence Encoder model...');
      this.modelPromise = tf
        .setBackend('cpu')
        .then(async () => {
          await tf.ready();

          return use.load();
        })
        .then((model) => {
          this.model = model;
          this.logger.log('Universal Sentence Encoder model loaded.');

          return model;
        });
    }

    return this.modelPromise;
  }

  private getUniqueWords(wordList: string[]): string[] {
    return Array.from(
      new Set(wordList.map((word) => this.normalizeText(word)).filter(Boolean)),
    );
  }

  private normalizeText(text: string): string {
    const normalizedText = text?.trim().toLowerCase();

    if (!normalizedText) {
      throw new BadRequestException('Text is required.');
    }

    return normalizedText;
  }

  private shuffleWords(words: string[]): string[] {
    return [...words].sort(() => Math.random() - 0.5);
  }
}
