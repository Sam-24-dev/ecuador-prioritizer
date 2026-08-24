export const NEWS_SEPARATOR = '--- NUEVA NOTICIA ---';
export const MAX_NEWS_ITEMS = 10;
export const MIN_NEWS_LENGTH = 15;
// The public batch API validates this maximum. Do not raise it without a compatible API change.
export const MAX_NEWS_LENGTH = 2000;
export const MAX_SOURCE_LENGTH = 200;

const separatorLine = /^--- NUEVA NOTICIA ---$/m;
const separatorSplit = /(?:^|\r?\n)--- NUEVA NOTICIA ---(?=\r?$|\n)/m;

export interface ParsedNewsBlocks {
  blocks: string[];
  hasSeparator: boolean;
}

export interface NewsBlocksValidation {
  emptyIndexes: number[];
  overCapacity: boolean;
}

export interface NewsPreviewBlocks {
  blocks: string[];
  error: string | null;
}

/** Splits only on the reserved separator line; article-like text is always left intact. */
export function parseNewsBlocks(text: string): ParsedNewsBlocks {
  return {
    blocks: text.split(separatorSplit),
    hasSeparator: separatorLine.test(text),
  };
}

export function validateNewsBlocks(blocks: string[]): NewsBlocksValidation {
  return {
    emptyIndexes: blocks.flatMap((block, index) => block.trim() ? [] : [index]),
    overCapacity: blocks.length > MAX_NEWS_ITEMS,
  };
}

/** Prepares pasted news for preview without inferring item boundaries. */
export function getNewsPreviewBlocks(text: string): NewsPreviewBlocks {
  const parsed = parseNewsBlocks(text);
  const validation = validateNewsBlocks(parsed.blocks);

  if (!parsed.blocks.some((block) => block.trim())) {
    return { blocks: parsed.blocks, error: 'Agrega el contenido de una noticia para revisarlo.' };
  }

  if (parsed.hasSeparator && (parsed.blocks.filter((block) => block.trim()).length < 2 || validation.emptyIndexes.length)) {
    return {
      blocks: parsed.blocks,
      error: 'Las noticias separadas deben tener contenido. Tu texto sigue disponible para corregirlo.',
    };
  }

  return { blocks: parsed.blocks, error: null };
}

export function newsLengthError(text: string): string | null {
  const length = text.trim().length;
  if (!length) return 'Agrega el contenido de esta noticia o quítala.';
  if (length < MIN_NEWS_LENGTH) return `Esta noticia necesita al menos ${MIN_NEWS_LENGTH} caracteres para continuar.`;
  if (length > MAX_NEWS_LENGTH) return `Esta noticia supera el límite por ${length - MAX_NEWS_LENGTH} caracteres. Reduce su extensión para continuar.`;
  return null;
}
