/**
 * Money utilities — all amounts stored as paise (integer), displayed as ₹
 */

/**
 * Format paise to Indian rupee string: ₹1,23,456
 */
export function formatMoney(paise: number): string {
  const rupees = paise / 100
  return '₹' + formatIndianNumber(rupees)
}

/**
 * Format a number with Indian comma grouping (1,23,456)
 */
export function formatIndianNumber(n: number): string {
  const [intPart, decPart] = n.toFixed(2).split('.')
  const lastThree = intPart.slice(-3)
  const rest = intPart.slice(0, -3)
  const formatted =
    rest.length > 0
      ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree
      : lastThree
  // drop .00 for whole numbers
  return decPart === '00' ? formatted : `${formatted}.${decPart}`
}

/**
 * Convert rupee string/number to paise integer
 */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100)
}

/**
 * Convert paise to rupee number
 */
export function paiseToRupees(paise: number): number {
  return paise / 100
}
