export function listToCommaSeparated(value?: string[] | null): string {
  return value?.join(', ') ?? '';
}

export function commaSeparatedToList(value: string): string[] {
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}
