export type SemanticValidationResult<T> =
  { data: T; issues: []; success: true } | { issues: string[]; success: false };
