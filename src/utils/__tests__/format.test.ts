import { commaSeparatedToList, listToCommaSeparated } from '../format';

describe('format utils', () => {
  it('converts list to comma separated string', () => {
    expect(listToCommaSeparated(['Italian', 'Sushi'])).toBe('Italian, Sushi');
    expect(listToCommaSeparated(null)).toBe('');
  });

  it('converts comma separated string to list', () => {
    expect(commaSeparatedToList('Italian, Sushi , Vegan')).toEqual(['Italian', 'Sushi', 'Vegan']);
    expect(commaSeparatedToList('')).toEqual([]);
  });
});
