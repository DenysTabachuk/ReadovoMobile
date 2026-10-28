/** Shared structure; each module owns the codes, statuses and messages it defines. */
export type ApiErrorDefinition<Code extends string = string> = {
  code: Code;
  statusCode: number;
  message: string;
};

/** For fallback errors whose HTTP status comes from the original exception. */
export type ApiErrorTemplate = Pick<ApiErrorDefinition, 'code' | 'message'>;
