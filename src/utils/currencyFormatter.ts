/**
 * Formats currency values with appropriate scale:
 * $x.xx / $xx.xx / $xxx.xx / $xk / $xxk / $xxxK / $xM / $xxM / $xxxM / $xB etc.
 */
export function formatPortfolioValue(value: number): string {
  const absValue = Math.abs(value);

  // Less than $1,000 - show with cents
  if (absValue < 1000) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  // $1,000 to $999,999 - show in thousands with 'k'
  if (absValue < 1000000) {
    const thousands = value / 1000;
    // For values < 10k, show one decimal: $9.5k
    if (absValue < 10000) {
      return `$${thousands.toFixed(1)}k`;
    }
    // For values >= 10k, show whole number: $125k
    return `$${Math.round(thousands)}k`;
  }

  // $1,000,000 to $999,999,999 - show in millions with 'M'
  if (absValue < 1000000000) {
    const millions = value / 1000000;
    // For values < 10M, show one decimal: $9.5M
    if (absValue < 10000000) {
      return `$${millions.toFixed(1)}M`;
    }
    // For values >= 10M, show whole number: $125M
    return `$${Math.round(millions)}M`;
  }

  // $1,000,000,000+ - show in billions with 'B'
  const billions = value / 1000000000;
  // For values < 10B, show one decimal: $9.5B
  if (absValue < 10000000000) {
    return `$${billions.toFixed(1)}B`;
  }
  // For values >= 10B, show whole number: $125B
  return `$${Math.round(billions)}B`;
}
