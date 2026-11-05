import {
  DICTIONARY_WORD_PROGRESS,
  DICTIONARY_TEST_QUESTION_FORMATS,
} from './constants';
import { type DictionaryWordResponseDto } from './dto/dictionary-word-response.dto';
import {
  type DictionaryTestQuestionDto,
  type GetDictionaryTestResponseDto,
} from './dto/get-dictionary-test-response.dto';

export type DictionaryWordProgress = (typeof DICTIONARY_WORD_PROGRESS)[number];
export type DictionaryTestQuestionFormat =
  (typeof DICTIONARY_TEST_QUESTION_FORMATS)[number];
export type DictionaryWord = DictionaryWordResponseDto;
export type DictionaryTestQuestion = DictionaryTestQuestionDto;
export type DictionaryTest = GetDictionaryTestResponseDto;
