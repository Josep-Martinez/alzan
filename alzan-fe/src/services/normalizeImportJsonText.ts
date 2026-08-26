const TYPOGRAPHIC_JSON_QUOTES = ['“', '”', '„', '‟', '«', '»', '＂'];
const TYPOGRAPHIC_JSON_OPEN_QUOTES = ['“', '„', '«'];
const TYPOGRAPHIC_JSON_CLOSE_QUOTES = ['”', '‟', '»'];
const JSON_STRUCTURAL_CHARACTERS = new Set([':', ',', '}', ']']);

const isTypographicJsonQuote = (value: string): boolean => TYPOGRAPHIC_JSON_QUOTES.includes(value);

const nextNonWhitespaceCharacter = (text: string, startIndex: number): string | undefined => {
  let index = startIndex;
  while (index < text.length && /\s/u.test(text[index] ?? '')) index += 1;
  return text[index];
};

const isClosingTypographicJsonQuote = (text: string, index: number): boolean => {
  const nextCharacter = nextNonWhitespaceCharacter(text, index + 1);
  return nextCharacter === undefined || JSON_STRUCTURAL_CHARACTERS.has(nextCharacter);
};

/**
 * Accepts only harmless formatting changes commonly introduced by mobile AI
 * copy/paste. It deliberately does not repair JSON structure or values.
 */
export const normalizeImportJsonText = (rawText: string): string => {
  let text = rawText.replace(/^\uFEFF/u, '').trim();
  const fencedText = /^```(?:json)?\s*([\s\S]*?)\s*```$/iu.exec(text);
  if (fencedText?.[1] !== undefined) text = fencedText[1].trim();
  const hasPairedTypographicQuotes =
    TYPOGRAPHIC_JSON_OPEN_QUOTES.some(quote => text.includes(quote)) &&
    TYPOGRAPHIC_JSON_CLOSE_QUOTES.some(quote => text.includes(quote));

  let normalized = '';
  let inString = false;
  let stringDelimiter: 'ascii' | 'typographic' | null = null;
  let escaped = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index] ?? '';

    if (inString) {
      if (escaped) {
        normalized += character;
        escaped = false;
        continue;
      }
      if (character === '\\') {
        normalized += character;
        escaped = true;
        continue;
      }
      const canCloseTypographicString = hasPairedTypographicQuotes
        ? TYPOGRAPHIC_JSON_CLOSE_QUOTES.includes(character)
        : isTypographicJsonQuote(character);
      if (stringDelimiter === 'typographic' && canCloseTypographicString) {
        if (isClosingTypographicJsonQuote(text, index)) {
          normalized += '"';
          inString = false;
          stringDelimiter = null;
          continue;
        }
      }

      normalized += character;
      if (stringDelimiter === 'ascii' && character === '"') {
        inString = false;
        stringDelimiter = null;
      }
      continue;
    }

    if (character === '"') {
      normalized += character;
      inString = true;
      stringDelimiter = 'ascii';
    } else if (
      isTypographicJsonQuote(character) &&
      (!hasPairedTypographicQuotes || TYPOGRAPHIC_JSON_OPEN_QUOTES.includes(character))
    ) {
      normalized += '"';
      inString = true;
      stringDelimiter = 'typographic';
    } else if (character === '\u00a0' || character === '\u202f') {
      normalized += ' ';
    } else {
      normalized += character;
    }
  }

  return normalized;
};
