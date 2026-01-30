/**
 * Format an amount as a currency string
 * @param amount The amount to format (in smallest unit, e.g., cents)
 * @param currencyCode The currency code (e.g., "usd", "eur")
 * @returns Formatted string (e.g., "$10.00")
 */
export const formatPrice = (
  amount: number | undefined | null,
  currencyCode: string | undefined,
) => {
  if (amount === undefined || amount === null) return null;

  const currency = currencyCode?.toUpperCase() || "USD";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount / 100);
};
