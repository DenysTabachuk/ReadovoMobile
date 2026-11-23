export const DEFAULT_TOPIC_COVER: number = require('./discover-topics.png');

// The API supplies content-owned object keys; bundled covers serve the local sample.
export const TOPIC_COVERS: ReadonlyMap<string, number> = new Map([
  ['learning/topics/germany/v1.png', require('./germany.png')],
  ['learning/topics/everyday-life/v1.png', require('./everyday-life.png')],
]);
