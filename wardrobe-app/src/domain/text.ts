/**
 * Case-folds free text for comparisons. Turkish lowercasing is needed so "İ" becomes "i", but on
 * its own it turns the English capital "I" into a dotless "ı" ("IVORY" → "ıvory"), so dotless "ı"
 * is folded to "i" as well. "IVORY", "Ivory" and "ivory" — and "KIRMIZI", "kırmızı", "kirmizi" —
 * then compare equal.
 */
export function foldCase(text: string): string {
  return text.toLocaleLowerCase('tr').replace(/ı/g, 'i');
}
