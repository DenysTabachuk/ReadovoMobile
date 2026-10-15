export function getBlockIndexFromTokenKey(
  tokenKey: string | undefined,
): number | null {
  const match = tokenKey?.match(/^block-(\d+)(?:-|$)/);
  const blockIndex = match?.[1] ? Number(match[1]) : NaN;

  if (!Number.isFinite(blockIndex)) {
    return null;
  }

  return blockIndex;
}
