export function isAnswerSelectionCorrect(
  selectedOptionIds: string[],
  correctOptionIds: string[],
): boolean {
  const selected = [...selectedOptionIds].sort();
  const correct = [...correctOptionIds].sort();

  return (
    selected.length === correct.length &&
    selected.every((optionId, index) => optionId === correct[index])
  );
}
