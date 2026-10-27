/** Provider HTTP failure without request configuration, tokens or response bodies. */
export class ExternalHttpError extends Error {
  constructor(readonly status: number) {
    super('External HTTP request failed.');
    this.name = 'ExternalHttpError';
  }
}
