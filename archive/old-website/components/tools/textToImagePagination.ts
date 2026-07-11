import {
  CONTINUATION_PAGE_MAX_LINES,
  FIRST_PAGE_MAX_LINES,
  MAX_CONTENT_PAGE_COUNT,
  MAX_UNITS_PER_LINE,
  RENDER_CONTINUATION_PAGE_SAFE_LINE_LIMIT,
  RENDER_FIRST_PAGE_SAFE_LINE_LIMIT,
  RENDER_PARAGRAPH_CONTENT_WIDTH,
  RENDER_PARAGRAPH_FONT,
  RENDER_PARAGRAPH_LETTER_SPACING_PX,
} from './textToImageConfig';

const isCjkCharacter = (character: string) => /[\u3400-\u9FFF\uF900-\uFAFF]/.test(character);

const estimateCharacterUnits = (character: string) => {
  if (isCjkCharacter(character)) {
    return 1;
  }

  if (/\s/.test(character)) {
    return 0.33;
  }

  if (/[A-Z0-9]/.test(character)) {
    return 0.64;
  }

  if (/[a-z]/.test(character)) {
    return 0.56;
  }

  return 0.6;
};

const estimateTokenUnits = (token: string) => (
  token.split('').reduce((total, character) => total + estimateCharacterUnits(character), 0)
);

const tokenizeSentence = (sentence: string) => (
  sentence.match(/[\u3400-\u9FFF\uF900-\uFAFF]|[^\s\u3400-\u9FFF\uF900-\uFAFF]+|\s+/g) ?? []
);

const splitTokenToLineSizedChunks = (token: string, maxUnitsPerLine: number) => {
  const chunks: string[] = [];
  let currentChunk = '';
  let currentUnits = 0;

  token.split('').forEach((character) => {
    const characterUnits = estimateCharacterUnits(character);
    if (currentChunk && currentUnits + characterUnits > maxUnitsPerLine) {
      chunks.push(currentChunk);
      currentChunk = character;
      currentUnits = characterUnits;
      return;
    }

    currentChunk += character;
    currentUnits += characterUnits;
  });

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
};

const wrapSentenceToLines = (sentence: string, maxUnitsPerLine: number) => {
  const tokens = tokenizeSentence(sentence);
  if (!tokens.length) {
    return [''];
  }

  const lines: string[] = [];
  let currentLine = '';
  let currentUnits = 0;

  const pushCurrentLine = () => {
    const trimmed = currentLine.trim();
    if (trimmed) {
      lines.push(trimmed);
    }
    currentLine = '';
    currentUnits = 0;
  };

  tokens.forEach((token) => {
    const tokenUnits = estimateTokenUnits(token);
    const isWhitespaceToken = /^\s+$/.test(token);
    const nextToken = !currentLine ? token.trimStart() : token;

    if (!nextToken && isWhitespaceToken) {
      return;
    }

    if (currentLine && currentUnits + tokenUnits > maxUnitsPerLine) {
      pushCurrentLine();
    }

    if (estimateTokenUnits(nextToken) <= maxUnitsPerLine) {
      if (!currentLine && isWhitespaceToken) {
        return;
      }

      currentLine += nextToken;
      currentUnits += estimateTokenUnits(nextToken);
      return;
    }

    splitTokenToLineSizedChunks(nextToken, maxUnitsPerLine).forEach((chunk, chunkIndex, allChunks) => {
      if (!chunk) {
        return;
      }

      if (chunkIndex === allChunks.length - 1) {
        currentLine += chunk;
        currentUnits += estimateTokenUnits(chunk);
        return;
      }

      lines.push(chunk);
    });
  });

  pushCurrentLine();

  return lines.length ? lines : [''];
};

const splitParagraphIntoSentenceUnits = (text: string) => {
  const normalized = text.replace(/\r\n/g, '\n').trim();
  if (!normalized) {
    return [];
  }

  const paragraphs = normalized
    .split(/\n+/)
    .map((segment) => segment.trim())
    .filter(Boolean);

  const units: Array<{ kind: 'sentence' | 'paragraph-break'; text?: string }> = [];

  paragraphs.forEach((paragraph, paragraphIndex) => {
    const sentences = paragraph
      .split(/(?<=[。！？!?\.])\s+/)
      .map((sentence) => sentence.trim())
      .filter(Boolean);

    if (sentences.length === 0) {
      units.push({ kind: 'sentence', text: paragraph });
    } else {
      sentences.forEach((sentence) => units.push({ kind: 'sentence', text: sentence }));
    }

    if (paragraphIndex < paragraphs.length - 1) {
      units.push({ kind: 'paragraph-break' });
    }
  });

  return units;
};

const trimTrailingBlankLines = (lines: string[]) => {
  const nextLines = [...lines];
  while (nextLines.length > 0 && nextLines[nextLines.length - 1] === '') {
    nextLines.pop();
  }
  return nextLines;
};

let textMeasureContext: CanvasRenderingContext2D | null = null;
const measuredLineWidthCache = new Map<string, number>();

const getTextMeasureContext = () => {
  if (textMeasureContext) {
    return textMeasureContext;
  }

  if (typeof document === 'undefined') {
    return null;
  }

  const canvas = document.createElement('canvas');
  textMeasureContext = canvas.getContext('2d');
  if (textMeasureContext) {
    textMeasureContext.font = RENDER_PARAGRAPH_FONT;
  }
  return textMeasureContext;
};

const estimateRenderedWrappedLineCount = (line: string, maxUnitsPerLine: number) => {
  if (!line) {
    return 1;
  }

  const context = getTextMeasureContext();
  if (!context) {
    // Fallback for non-browser contexts.
    return Math.max(1, Math.ceil((estimateTokenUnits(line) / maxUnitsPerLine) * 1.2));
  }

  if (context.font !== RENDER_PARAGRAPH_FONT) {
    context.font = RENDER_PARAGRAPH_FONT;
  }

  const cacheKey = line;
  const cached = measuredLineWidthCache.get(cacheKey);
  let measuredWidth = cached;
  if (typeof measuredWidth !== 'number') {
    const letterSpacingWidth = Math.max(0, line.length - 1) * RENDER_PARAGRAPH_LETTER_SPACING_PX;
    measuredWidth = context.measureText(line).width + letterSpacingWidth;
    measuredLineWidthCache.set(cacheKey, measuredWidth);
  }

  return Math.max(1, Math.ceil(measuredWidth / RENDER_PARAGRAPH_CONTENT_WIDTH));
};

const estimateRenderedPageLineCount = (pageText: string, maxUnitsPerLine: number) => (
  pageText.split('\n').reduce((total, line) => (
    total + estimateRenderedWrappedLineCount(line, maxUnitsPerLine)
  ), 0)
);

const splitPageIntoParagraphBlocks = (pageText: string) => {
  const lines = pageText.split('\n');
  const blocks: string[] = [];
  let currentBlock: string[] = [];

  lines.forEach((line) => {
    if (line === '') {
      const cleaned = trimTrailingBlankLines(currentBlock);
      if (cleaned.length > 0) {
        blocks.push(cleaned.join('\n'));
      }
      currentBlock = [];
      return;
    }

    currentBlock.push(line);
  });

  const cleaned = trimTrailingBlankLines(currentBlock);
  if (cleaned.length > 0) {
    blocks.push(cleaned.join('\n'));
  }

  return blocks;
};

const moveTrailingContentToNextPage = (pages: string[], pageIndex: number) => {
  const pageText = pages[pageIndex];
  if (!pageText) {
    return false;
  }

  const paragraphBlocks = splitPageIntoParagraphBlocks(pageText);
  if (!paragraphBlocks.length) {
    return false;
  }

  let movedContent = '';
  let nextCurrentPageText = '';

  if (paragraphBlocks.length > 1) {
    movedContent = paragraphBlocks[paragraphBlocks.length - 1] ?? '';
    nextCurrentPageText = paragraphBlocks.slice(0, -1).join('\n\n');
  } else {
    const lineBlocks = trimTrailingBlankLines(pageText.split('\n'));
    if (lineBlocks.length <= 1) {
      return false;
    }
    movedContent = lineBlocks[lineBlocks.length - 1] ?? '';
    nextCurrentPageText = lineBlocks.slice(0, -1).join('\n');
  }

  if (!nextCurrentPageText || !movedContent) {
    return false;
  }

  pages[pageIndex] = nextCurrentPageText;
  const existingNextPage = pages[pageIndex + 1];
  if (existingNextPage) {
    pages[pageIndex + 1] = `${movedContent}\n\n${existingNextPage}`;
  } else if (pages.length < MAX_CONTENT_PAGE_COUNT) {
    pages.push(movedContent);
  } else {
    return false;
  }

  return true;
};

const rebalanceForRenderOverflow = (
  pageTexts: string[],
  maxUnitsPerLine: number,
) => {
  const nextPages = [...pageTexts];
  const MAX_REBALANCE_STEPS = 80;
  let steps = 0;

  for (let pageIndex = 0; pageIndex < nextPages.length && steps < MAX_REBALANCE_STEPS; pageIndex += 1) {
    const safeLineLimit = pageIndex === 0
      ? RENDER_FIRST_PAGE_SAFE_LINE_LIMIT
      : RENDER_CONTINUATION_PAGE_SAFE_LINE_LIMIT;

    while (
      estimateRenderedPageLineCount(nextPages[pageIndex] ?? '', maxUnitsPerLine) > safeLineLimit
      && steps < MAX_REBALANCE_STEPS
    ) {
      const moved = moveTrailingContentToNextPage(nextPages, pageIndex);
      if (!moved) {
        break;
      }
      steps += 1;
    }
  }

  return nextPages;
};

export const paginateTextBySentence = (
  text: string,
  maxUnitsPerLine = MAX_UNITS_PER_LINE,
  firstPageMaxLines = FIRST_PAGE_MAX_LINES,
  continuationPageMaxLines = CONTINUATION_PAGE_MAX_LINES,
) => {
  const units = splitParagraphIntoSentenceUnits(text);
  if (!units.length) {
    return [];
  }

  const pages: string[] = [];
  let currentPageLines: string[] = [];
  const getCurrentMaxLines = () => (
    pages.length === 0 ? firstPageMaxLines : continuationPageMaxLines
  );

  const flushPage = () => {
    const cleaned = trimTrailingBlankLines(currentPageLines);
    if (cleaned.length > 0) {
      pages.push(cleaned.join('\n'));
    }
    currentPageLines = [];
  };

  units.forEach((unit) => {
    if (unit.kind === 'paragraph-break') {
      if (currentPageLines.length && currentPageLines[currentPageLines.length - 1] !== '') {
        if (currentPageLines.length >= getCurrentMaxLines()) {
          flushPage();
        }
        currentPageLines.push('');
      }
      return;
    }

    const sentenceLines = wrapSentenceToLines(unit.text ?? '', maxUnitsPerLine);
    let remainingLines = [...sentenceLines];

    while (remainingLines.length > 0) {
      const currentMaxLines = getCurrentMaxLines();

      if (currentPageLines.length >= currentMaxLines) {
        flushPage();
      }

      const refreshedMaxLines = getCurrentMaxLines();
      const remainingCapacity = refreshedMaxLines - currentPageLines.length;

      if (remainingLines.length <= remainingCapacity) {
        currentPageLines.push(...remainingLines);
        remainingLines = [];
      } else if (currentPageLines.length > 0) {
        flushPage();
      } else {
        currentPageLines.push(...remainingLines.slice(0, remainingCapacity));
        remainingLines = remainingLines.slice(remainingCapacity);
        flushPage();
      }
    }
  });

  flushPage();
  return rebalanceForRenderOverflow(pages, maxUnitsPerLine);
};
