export type CsvCellValue = string | number | null;

interface CsvCellOptions {
  trustedGeneratedNumber?: boolean;
}

function requiresFormulaNeutralization(value: string): boolean {
  return /^[\s]*[=+\-@]/.test(value);
}

export function escapeCsvCell(value: CsvCellValue, options: CsvCellOptions = {}): string {
  const normalized = value == null ? '' : String(value);
  const isTrustedGeneratedNumber = options.trustedGeneratedNumber
    && typeof value === 'number'
    && Number.isFinite(value);
  const neutralized = !isTrustedGeneratedNumber && requiresFormulaNeutralization(normalized)
    ? `'${normalized}`
    : normalized;

  return `"${neutralized.replaceAll('"', '""')}"`;
}