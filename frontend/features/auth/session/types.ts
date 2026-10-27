export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type SessionRequest<T> = {
  input: RequestInfo | URL;
  init?: RequestInit;
  /** Map HTTP errors and eagerly consume the body; do not perform feature effects. */
  parse: (response: Response) => Promise<T>;
};

export type AuthSessionClient = {
  readonly id: symbol;
  readonly ownerId: string;
  readonly signal: AbortSignal;
  readonly isActive: boolean;
  request<T>(request: SessionRequest<T>): Promise<T>;
};
