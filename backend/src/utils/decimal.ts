type DecimalLike = {
  toNumber?: () => number;
  toString: () => string;
};

export function decimalToNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value);

  if (typeof value === 'object') {
    const maybeDecimal = value as DecimalLike;
    if (typeof maybeDecimal.toNumber === 'function') return maybeDecimal.toNumber();
    return Number(maybeDecimal.toString());
  }

  return Number(value);
}

export function decimalToString(value: unknown): string {
  if (value === null || value === undefined) return '0';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'object') return (value as { toString: () => string }).toString();
  return String(value);
}
