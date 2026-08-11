/**
 * Deterministic seeded Fisher-Yates shuffle using a Linear Congruential Generator
 * seeded with a djb2 hash of the input seed string.
 *
 * Purpose: Exam paper generation — same student always gets the same paper variant,
 * different students get different variants, without storing per-student question order
 * until paper snapshot time.
 */

/**
 * djb2 hash: maps an arbitrary string to a 32-bit unsigned integer.
 * @param str - seed string (e.g. `${examId}:${studentId}`)
 * @returns unsigned 32-bit integer
 */
function djb2Hash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    // hash * 33 + charCode, keep in 32-bit range via unsigned right shift
    hash = ((hash << 5) + hash + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/**
 * LCG (Linear Congruential Generator) producing values in [0, 1).
 * Parameters: Numerical Recipes LCG — a=1664525, c=1013904223, m=2^32.
 * Returns a factory (closure over mutable seed state).
 *
 * @param seed - initial seed (32-bit unsigned integer)
 * @returns function that advances the LCG and returns a float in [0, 1)
 */
function makeLcg(seed: number): () => number {
  let state = seed >>> 0; // force unsigned 32-bit
  return function nextFloat(): number {
    state = ((Math.imul(1664525, state) + 1013904223) >>> 0);
    return state / 0x100000000; // divide by 2^32 → [0, 1)
  };
}

/**
 * Performs an in-place Fisher-Yates shuffle on `arr` using a deterministic
 * LCG seeded from `seedStr` via djb2.  Returns the same array (mutated).
 *
 * @param arr - array to shuffle (mutated in place)
 * @param seedStr - seed string, e.g. `${examId}:${studentId}`
 * @returns the shuffled array
 */
export function seededShuffle<T>(arr: T[], seedStr: string): T[] {
  const rand = makeLcg(djb2Hash(seedStr));
  for (let i = arr.length - 1; i > 0; i--) {
    // Pick a random index in [0, i]
    const j = Math.floor(rand() * (i + 1));
    // Swap arr[i] and arr[j]
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}
