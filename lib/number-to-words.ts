// Converts a whole-dirham amount into words for the "Amount in Words" line,
// matching the style SEC already uses on their quotations
// ("TWO HUNDRED SEVENTY EIGHT THOUSAND THREE HUNDRED FIFTY FIVE").

const ONES = [
  "", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE",
  "TEN", "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN",
  "SEVENTEEN", "EIGHTEEN", "NINETEEN",
];
const TENS = ["", "", "TWENTY", "THIRTY", "FORTY", "FIFTY", "SIXTY", "SEVENTY", "EIGHTY", "NINETY"];

function chunkToWords(n: number): string {
  if (n === 0) return "";
  if (n < 20) return ONES[n];
  if (n < 100) return `${TENS[Math.floor(n / 10)]}${n % 10 ? " " + ONES[n % 10] : ""}`;
  return `${ONES[Math.floor(n / 100)]} HUNDRED${n % 100 ? " " + chunkToWords(n % 100) : ""}`;
}

function integerToWords(n: number): string {
  if (n === 0) return "ZERO";
  const groups: [number, string][] = [
    [1_000_000_000, "BILLION"],
    [1_000_000, "MILLION"],
    [1_000, "THOUSAND"],
    [1, ""],
  ];
  let remaining = n;
  const parts: string[] = [];
  for (const [value, label] of groups) {
    const count = Math.floor(remaining / value);
    if (count > 0) {
      parts.push(`${chunkToWords(count)}${label ? " " + label : ""}`);
      remaining %= value;
    }
  }
  return parts.join(" ");
}

export function amountToWordsAED(amount: number): string {
  const dirhams = Math.floor(amount);
  const fils = Math.round((amount - dirhams) * 100);
  const dirhamsWords = `${integerToWords(dirhams)} UAE DIRHAM${dirhams === 1 ? "" : "S"}`;
  if (fils === 0) return `${dirhamsWords} ONLY`;
  return `${dirhamsWords} AND ${integerToWords(fils)} FILS ONLY`;
}
