import { PicturePractice } from '../../components/picturePractice';
import { AudioPrompt } from './components/audioPrompt';

export default function VocabularyAudioPracticeScreen() {
  return (
    <PicturePractice
      titleKey="vocabulary.audio.title"
      sampleKey="vocabulary.audio.sample"
      renderPrompt={(word, questionId) => (
        <AudioPrompt questionId={questionId} word={word.word} />
      )}
    />
  );
}
