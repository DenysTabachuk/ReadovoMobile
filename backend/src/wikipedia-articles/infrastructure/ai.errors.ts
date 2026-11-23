export class AiResponseContractError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = AiResponseContractError.name;
  }
}

export class AiSemanticValidationError extends Error {
  constructor(
    readonly operation: string,
    readonly issues: string[],
  ) {
    super(
      `AI output for operation "${operation}" failed semantic validation after one retry: ${issues.join(' | ')}`,
    );
    this.name = AiSemanticValidationError.name;
  }
}
