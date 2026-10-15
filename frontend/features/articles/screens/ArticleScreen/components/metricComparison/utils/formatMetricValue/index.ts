export function formatMetricValue(
  value: number,
  decimals: number,
  suffix: string,
): string {
  const formatted =
    decimals > 0 ? value.toFixed(decimals) : String(Math.round(value));
  return suffix ? `${formatted} ${suffix}` : formatted;
}
