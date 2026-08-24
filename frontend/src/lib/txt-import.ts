export type TxtImportValidation =
  | { ok: true; text: string }
  | { ok: false; feedback: string };

const MIN_TEXT_LENGTH = 15;
const MAX_TEXT_LENGTH = 2000;
const TEXT_LENGTH_FEEDBACK = 'debe contener entre 15 y 2000 caracteres.';

export function validateTxtImport(rawText: string): TxtImportValidation {
  const text = rawText.trim();
  if (text.length < MIN_TEXT_LENGTH || text.length > MAX_TEXT_LENGTH) {
    return { ok: false, feedback: TEXT_LENGTH_FEEDBACK };
  }

  return { ok: true, text };
}
