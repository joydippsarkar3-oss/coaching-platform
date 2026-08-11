import { seededShuffle } from './seeded-shuffle';

describe('seededShuffle', () => {
  it('returns [] for an empty array', () => {
    expect(seededShuffle([], 'any-seed')).toEqual([]);
  });

  it('returns [element] for a single-element array', () => {
    expect(seededShuffle([42], 'any-seed')).toEqual([42]);
  });

  it('same seed always produces the same output order', () => {
    const input = () => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const seed = 'exam-123:student-456';
    const first = seededShuffle(input(), seed);
    const second = seededShuffle(input(), seed);
    expect(first).toEqual(second);
  });

  it('different seeds produce different orders (for a reasonably sized array)', () => {
    const input = () => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const a = seededShuffle(input(), 'seed-A');
    const b = seededShuffle(input(), 'seed-B');
    // Statistically extremely unlikely to be identical for 10 elements
    expect(a).not.toEqual(b);
  });

  it('no elements are lost or duplicated', () => {
    const input = ['a', 'b', 'c', 'd', 'e', 'f'];
    const result = seededShuffle([...input], 'integrity-seed');
    expect(result).toHaveLength(input.length);
    expect(result.sort()).toEqual([...input].sort());
  });

  it('mutates and returns the same array reference', () => {
    const arr = [1, 2, 3];
    const result = seededShuffle(arr, 'ref-seed');
    expect(result).toBe(arr);
  });
});
