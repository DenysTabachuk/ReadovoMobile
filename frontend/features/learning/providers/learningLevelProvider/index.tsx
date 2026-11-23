import { createContext, useContext, useState, type ReactNode } from 'react';
import type { VocabularyLevel } from '@/api/generated/transport';

type LearningLevelContextValue = {
  selectedLevel: VocabularyLevel | null;
  selectLevel: (level: VocabularyLevel) => void;
};
type LearningLevelProviderProps = { children: ReactNode };
const LearningLevelContext = createContext<LearningLevelContextValue | null>(
  null,
);

export function LearningLevelProvider({
  children,
}: LearningLevelProviderProps) {
  // Browsing preference only; the auth-session boundary resets it on account changes.
  const [selectedLevel, selectLevel] = useState<VocabularyLevel | null>(null);
  return (
    <LearningLevelContext.Provider value={{ selectedLevel, selectLevel }}>
      {children}
    </LearningLevelContext.Provider>
  );
}

export function useLearningLevel() {
  const context = useContext(LearningLevelContext);
  if (!context) throw new Error('LearningLevelProvider is required.');
  return context;
}
