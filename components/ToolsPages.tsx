import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import GlitchText from './GlitchText';

const TEXT_TO_IMG_RENDER_ENDPOINT = import.meta.env.VITE_TEXT_TO_IMG_RENDER_ENDPOINT || '/api/tools/text-to-img-post/render';
const MAX_TOTAL_TEXT_LENGTH = 2500;
const MAX_TOTAL_PAGE_COUNT = 15;
const TITLE_PAGE_COUNT = 1;
const MAX_CONTENT_PAGE_COUNT = MAX_TOTAL_PAGE_COUNT - TITLE_PAGE_COUNT;
const MAX_UNITS_PER_LINE = 29;
const FIRST_PAGE_MAX_LINES = 18;
const CONTINUATION_PAGE_MAX_LINES = 24;
const RENDER_OUTPUT_HEIGHT = 2400;
const RENDER_BODY_PADDING_TOP = 224;
const RENDER_BODY_PADDING_BOTTOM = 168;
const RENDER_HEADER_HEIGHT_FIRST = 396;
const RENDER_HEADER_HEIGHT_CONTINUATION = 110;
const RENDER_HEADER_PADDING_TOP_FIRST = 168;
const RENDER_PARAGRAPH_MARGIN_TOP_FIRST = 52;
const RENDER_PARAGRAPH_MARGIN_TOP_CONTINUATION = 40;
const RENDER_FOOTER_MARGIN_TOP = 42;
const RENDER_FOOTER_PADDING_TOP = 28;
const RENDER_FOOTER_TEXT_HEIGHT = 34;
const RENDER_PARAGRAPH_PADDING = 72;
const RENDER_PARAGRAPH_TEXT_RIGHT_GUARD = 14;
const RENDER_PARAGRAPH_FONT_SIZE = 50;
const RENDER_PARAGRAPH_LINE_HEIGHT = 1.48;
const RENDER_PARAGRAPH_CONTENT_WIDTH = 1440 - (108 * 2) - (RENDER_PARAGRAPH_PADDING * 2) - RENDER_PARAGRAPH_TEXT_RIGHT_GUARD;
const RENDER_PARAGRAPH_LETTER_SPACING_PX = RENDER_PARAGRAPH_FONT_SIZE * 0.015;
const RENDER_PARAGRAPH_FONT = `400 ${RENDER_PARAGRAPH_FONT_SIZE}px "Space Mono", "Noto Sans SC"`;
const RENDER_FIRST_PAGE_SAFE_LINE_LIMIT = Math.max(
  1,
  Math.floor((
    RENDER_OUTPUT_HEIGHT
    - RENDER_BODY_PADDING_TOP
    - RENDER_BODY_PADDING_BOTTOM
    - RENDER_HEADER_HEIGHT_FIRST
    - RENDER_HEADER_PADDING_TOP_FIRST
    - RENDER_PARAGRAPH_MARGIN_TOP_FIRST
    - RENDER_FOOTER_MARGIN_TOP
    - RENDER_FOOTER_PADDING_TOP
    - RENDER_FOOTER_TEXT_HEIGHT
    - (RENDER_PARAGRAPH_PADDING * 2)
  ) / (RENDER_PARAGRAPH_FONT_SIZE * RENDER_PARAGRAPH_LINE_HEIGHT)) - 1,
);
const RENDER_CONTINUATION_PAGE_SAFE_LINE_LIMIT = Math.max(
  1,
  Math.floor((
    RENDER_OUTPUT_HEIGHT
    - RENDER_BODY_PADDING_TOP
    - RENDER_BODY_PADDING_BOTTOM
    - RENDER_HEADER_HEIGHT_CONTINUATION
    - RENDER_PARAGRAPH_MARGIN_TOP_CONTINUATION
    - RENDER_FOOTER_MARGIN_TOP
    - RENDER_FOOTER_PADDING_TOP
    - RENDER_FOOTER_TEXT_HEIGHT
    - (RENDER_PARAGRAPH_PADDING * 2)
  ) / (RENDER_PARAGRAPH_FONT_SIZE * RENDER_PARAGRAPH_LINE_HEIGHT)) - 1,
);

type GeneratedToolImage = {
  id: string;
  blob: Blob;
  url: string;
  filename: string;
  pageIndex: number;
  pageCount: number;
};

type ToolsLauncherCardProps = {
  onOpenTextToImagePost: () => void;
};

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

const paginateTextBySentence = (
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

const triggerBlobDownload = (blob: Blob, filename: string) => {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1200);
};

const wait = (durationMs: number) => new Promise((resolve) => {
  window.setTimeout(resolve, durationMs);
});

export function ToolsLauncherCard({ onOpenTextToImagePost }: ToolsLauncherCardProps) {
  return (
    <div className="relative z-10 h-full w-full px-4 pb-4 pt-24 md:px-12 md:pb-8 md:pt-28">
      <div className="mx-auto flex h-full w-full max-w-4xl flex-col">
        <div className="shrink-0">
          <GlitchText
            text="TOOLS"
            wrapToWidth={false}
            className="font-display text-[clamp(2rem,8vw,5.4rem)] font-black tracking-tight text-[var(--text-primary)]"
          />
        </div>

        <div className="flex min-h-0 flex-1 items-center justify-center">
          <section className="w-full border border-[var(--border-soft)] bg-[rgba(8,8,8,0.2)]">
            <button
              type="button"
              onClick={onOpenTextToImagePost}
              className="block w-full text-left transition-colors duration-300 hover:bg-[rgba(201,115,56,0.08)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--accent-secondary)]"
              aria-label="Open text_to_img_post tool"
            >
              <div className="grid gap-3 px-5 py-4 md:px-7 md:py-5">
                <GlitchText
                  text="text_to_img_post"
                  wrapToWidth={false}
                  className="font-display text-[clamp(1.4rem,3.5vw,2.3rem)] font-black tracking-[0.04em] text-[var(--text-primary)]"
                />
                <div className="border border-[var(--border-soft)] bg-[rgba(8,8,8,0.18)] px-4 py-3 font-mono text-[0.68rem] uppercase tracking-[0.16em] text-[var(--text-secondary)] md:text-[0.72rem]">
                  Format text into clean, shareable images for social media.
                </div>
              </div>
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}

export function TextToImagePostToolPage() {
  const [title, setTitle] = useState('');
  const [paragraph, setParagraph] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedToolImage[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const generatedImagesRef = useRef<GeneratedToolImage[]>([]);

  const totalTextLength = useMemo(() => (
    title.trim().length + paragraph.trim().length
  ), [title, paragraph]);

  useEffect(() => {
    generatedImagesRef.current = generatedImages;
  }, [generatedImages]);

  useEffect(() => () => {
    generatedImagesRef.current.forEach((image) => URL.revokeObjectURL(image.url));
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined;
    }

    const previousHtmlOverflowX = document.documentElement.style.overflowX;
    const previousBodyOverflowX = document.body.style.overflowX;
    document.documentElement.style.overflowX = 'hidden';
    document.body.style.overflowX = 'hidden';

    return () => {
      document.documentElement.style.overflowX = previousHtmlOverflowX;
      document.body.style.overflowX = previousBodyOverflowX;
    };
  }, []);

  const shareFilesIfSupported = async (files: File[], shareTitle: string) => {
    if (
      typeof navigator === 'undefined'
      || typeof navigator.share !== 'function'
    ) {
      return false;
    }

    const payload = { files, title: shareTitle };
    if (typeof navigator.canShare === 'function' && !navigator.canShare(payload)) {
      return false;
    }

    try {
      await navigator.share(payload);
      return true;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return true;
      }
      return false;
    }
  };

  const blobToDataUrl = (blob: Blob) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Unable to encode image.'));
      }
    };
    reader.onerror = () => reject(new Error('Unable to encode image.'));
    reader.readAsDataURL(blob);
  });

  const openPhotoSaveWindow = async (images: Array<{ filename: string; blob: Blob }>) => {
    if (typeof window === 'undefined') {
      return false;
    }

    const popup = window.open('', '_blank');
    if (!popup) {
      return false;
    }

    popup.document.write('<!doctype html><title>Save Images</title><meta name="viewport" content="width=device-width,initial-scale=1" /><body style="margin:0;background:#111;color:#f3e6cb;font-family:ui-monospace, SFMono-Regular, Menlo, monospace;padding:16px;">Preparing images…</body>');

    try {
      const encoded = await Promise.all(images.map(async (image) => ({
        filename: image.filename,
        src: await blobToDataUrl(image.blob),
      })));

      const cards = encoded.map((image, index) => `
        <article style="margin:0 0 20px 0;padding:12px;border:1px solid rgba(243,230,203,0.25);background:rgba(18,18,18,0.92);">
          <div style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;opacity:0.85;margin-bottom:10px;">Image ${index + 1}: ${image.filename}</div>
          <img src="${image.src}" alt="${image.filename}" style="width:100%;height:auto;display:block;border:1px solid rgba(243,230,203,0.16);" />
        </article>
      `).join('');

      popup.document.body.innerHTML = `
        <main style="max-width:680px;margin:0 auto;">
          <h1 style="margin:0 0 12px 0;font-size:16px;letter-spacing:0.1em;text-transform:uppercase;">Save To Photos</h1>
          <p style="margin:0 0 16px 0;font-size:13px;line-height:1.5;opacity:0.85;">Long press each image, then tap "Save to Photos" or "Add to Photos".</p>
          ${cards}
        </main>
      `;
      return true;
    } catch {
      popup.close();
      return false;
    }
  };

  const clearGeneratedImages = () => {
    generatedImagesRef.current.forEach((image) => URL.revokeObjectURL(image.url));
    generatedImagesRef.current = [];
    setGeneratedImages([]);
    setActiveImageIndex(0);
  };

  const handleGenerate = async () => {
    const trimmedTitle = title.trim();
    const trimmedParagraph = paragraph.trim();

    if (!trimmedTitle || !trimmedParagraph) {
      setErrorMessage('Please add both title and paragraph.');
      return;
    }

    if (totalTextLength > MAX_TOTAL_TEXT_LENGTH) {
      setErrorMessage(`Total text must stay within ${MAX_TOTAL_TEXT_LENGTH} characters.`);
      return;
    }

    const pageTexts = paginateTextBySentence(trimmedParagraph);

    if (!pageTexts.length) {
      setErrorMessage('Unable to generate pages from the provided paragraph.');
      return;
    }

    if (pageTexts.length > MAX_CONTENT_PAGE_COUNT) {
      setErrorMessage(`Text is too long for this tool. Maximum output is ${MAX_TOTAL_PAGE_COUNT} pages including title.`);
      return;
    }

    setErrorMessage(null);
    setIsGenerating(true);

    const nextImages: GeneratedToolImage[] = [];
    try {
      for (let index = 0; index < pageTexts.length; index += 1) {
        const response = await fetch(TEXT_TO_IMG_RENDER_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: trimmedTitle,
            paragraph: pageTexts[index],
            pageIndex: index + 1,
            pageCount: pageTexts.length,
          }),
        });

        if (!response.ok) {
          let serverErrorMessage = 'Image rendering failed. Please retry.';
          try {
            const parsed = await response.json();
            if (typeof parsed?.message === 'string') {
              serverErrorMessage = parsed.message;
            }
          } catch {
            // Keep fallback message.
          }
          throw new Error(serverErrorMessage);
        }

        const imageBlob = await response.blob();
        const imageUrl = URL.createObjectURL(imageBlob);
        nextImages.push({
          id: `generated-${index + 1}-${Date.now()}`,
          blob: imageBlob,
          url: imageUrl,
          filename: `text_to_img_post_${String(index + 1).padStart(2, '0')}.png`,
          pageIndex: index + 1,
          pageCount: pageTexts.length,
        });
      }

      clearGeneratedImages();
      generatedImagesRef.current = nextImages;
      setGeneratedImages(nextImages);
      setActiveImageIndex(0);
    } catch (error) {
      nextImages.forEach((image) => URL.revokeObjectURL(image.url));
      console.error(error);
      setErrorMessage(error instanceof Error ? error.message : 'Unexpected rendering error.');
    } finally {
      setIsGenerating(false);
    }
  };

  const hasGeneratedImages = generatedImages.length > 0;
  const currentImage = hasGeneratedImages ? generatedImages[activeImageIndex] : null;

  const goToPreviousImage = () => {
    if (!hasGeneratedImages) {
      return;
    }

    setActiveImageIndex((current) => (
      current === 0 ? generatedImages.length - 1 : current - 1
    ));
  };

  const goToNextImage = () => {
    if (!hasGeneratedImages) {
      return;
    }

    setActiveImageIndex((current) => (
      current === generatedImages.length - 1 ? 0 : current + 1
    ));
  };

  const downloadCurrentImage = () => {
    if (!currentImage) {
      return;
    }

    const file = new File([currentImage.blob], currentImage.filename, { type: currentImage.blob.type || 'image/png' });
    void shareFilesIfSupported([file], 'Save image').then((shared) => {
      if (!shared) {
        void openPhotoSaveWindow([{ filename: currentImage.filename, blob: currentImage.blob }]).then((opened) => {
          if (!opened) {
            triggerBlobDownload(currentImage.blob, currentImage.filename);
          }
        });
      }
    });
  };

  const downloadAllImages = async () => {
    if (!hasGeneratedImages || isDownloadingAll) {
      return;
    }

    setIsDownloadingAll(true);
    try {
      const allFiles = generatedImages.map((image) => (
        new File([image.blob], image.filename, { type: image.blob.type || 'image/png' })
      ));
      const shared = await shareFilesIfSupported(allFiles, 'Save images');
      if (shared) {
        return;
      }

      const opened = await openPhotoSaveWindow(generatedImages.map((image) => ({
        filename: image.filename,
        blob: image.blob,
      })));
      if (opened) {
        return;
      }

      for (const image of generatedImages) {
        triggerBlobDownload(image.blob, image.filename);
        await wait(150);
      }
    } finally {
      setIsDownloadingAll(false);
    }
  };

  return (
    <div className="relative z-10 flex w-full max-w-full flex-col overflow-x-hidden px-3 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] pt-[calc(4.5rem+env(safe-area-inset-top,0px))] md:h-full md:px-10 md:pb-8 md:pt-28">
      <div className="mx-auto flex w-full max-w-[92rem] flex-col gap-3 md:h-full md:gap-5">
        <header className="grid gap-2 border border-[var(--border-soft)] bg-[rgba(8,8,8,0.2)] px-3 py-3 md:items-end md:gap-5 md:px-7 md:py-5">
          <div className="min-w-0">
            <GlitchText
              text="TEXT_TO_IMG_POST"
              wrapToWidth={false}
              className="block font-display text-[clamp(1rem,7vw,1.55rem)] font-black tracking-[0.04em] text-[var(--text-primary)] md:text-[clamp(1.2rem,3.2vw,2.3rem)] md:tracking-[0.05em]"
            />
          </div>
        </header>

        <div className="grid gap-3 md:min-h-0 md:flex-1 md:grid-cols-[minmax(22rem,28rem)_minmax(0,1fr)] md:gap-5">
          <section className="flex flex-col border border-[var(--border-soft)] bg-[rgba(8,8,8,0.2)] md:min-h-0">
            <div className="border-b border-[var(--border-soft)] px-3 py-2.5 font-mono text-[0.61rem] uppercase tracking-[0.2em] text-[var(--text-secondary)] md:px-5 md:py-3 md:text-[0.64rem] md:tracking-[0.22em]">
              Inputs
            </div>
            <div className="grid gap-3 p-3 md:gap-4 md:p-5">
              <label className="grid gap-2">
                <span className="font-mono text-[0.63rem] uppercase tracking-[0.2em] text-[var(--text-secondary)]">Title</span>
                <input
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="POST TITLE"
                  className="w-full border border-[var(--border-soft)] bg-[rgba(8,8,8,0.22)] px-3 py-3 font-mono text-[16px] tracking-[0.06em] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:border-[var(--accent-secondary)] focus:outline-none md:text-sm"
                />
              </label>

              <label className="grid gap-2">
                <span className="font-mono text-[0.63rem] uppercase tracking-[0.2em] text-[var(--text-secondary)]">Paragraph</span>
                <textarea
                  value={paragraph}
                  onChange={(event) => setParagraph(event.target.value)}
                  placeholder="Paste or write paragraph content..."
                  rows={10}
                  className="h-[11rem] resize-none border border-[var(--border-soft)] bg-[rgba(8,8,8,0.22)] px-3 py-3 font-mono text-[16px] leading-relaxed tracking-[0.05em] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:border-[var(--accent-secondary)] focus:outline-none md:h-[16rem] md:text-sm"
                />
              </label>

              <div className="flex flex-wrap items-center justify-between gap-2 border border-[var(--border-soft)] bg-[rgba(8,8,8,0.16)] px-3 py-2 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                <span>Total Characters</span>
                <span className={totalTextLength > MAX_TOTAL_TEXT_LENGTH ? 'text-[var(--accent-secondary)]' : 'text-[var(--text-primary)]'}>
                  {totalTextLength} / {MAX_TOTAL_TEXT_LENGTH}
                </span>
              </div>
              <p className="font-mono text-[0.58rem] uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                Max output: {MAX_TOTAL_PAGE_COUNT} pages total (includes title page).
              </p>

              {errorMessage && (
                <p className="border border-[var(--accent-secondary)] bg-[rgba(201,115,56,0.08)] px-3 py-2 font-mono text-[0.66rem] uppercase tracking-[0.14em] text-[var(--accent-secondary)]">
                  {errorMessage}
                </p>
              )}

              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full border border-[var(--border-strong)] bg-[rgba(201,115,56,0.14)] px-4 py-3 font-mono text-[0.68rem] uppercase tracking-[0.2em] text-[var(--text-primary)] transition-colors hover:border-[var(--accent-secondary)] hover:bg-[var(--accent-primary)] disabled:cursor-wait disabled:opacity-70"
              >
                {isGenerating ? 'Generating…' : 'Generate Images'}
              </button>
            </div>
          </section>

          <section className="flex flex-col border border-[var(--border-soft)] bg-[rgba(8,8,8,0.2)] md:min-h-0">
            <div className="flex items-center justify-between gap-3 border-b border-[var(--border-soft)] px-3 py-2.5 font-mono text-[0.61rem] uppercase tracking-[0.2em] text-[var(--text-secondary)] md:px-5 md:py-3 md:text-[0.64rem] md:tracking-[0.22em]">
              <span>Carousel Preview</span>
              <span className="text-[var(--text-primary)]">
                {hasGeneratedImages ? `${activeImageIndex + 1}/${generatedImages.length}` : '0/0'}
              </span>
            </div>

            <div className="flex flex-col gap-3 p-3 md:min-h-0 md:flex-1 md:gap-4 md:p-5">
              <div className="relative flex min-h-[18.5rem] items-center justify-center border border-[var(--border-soft)] bg-[rgba(8,8,8,0.18)] px-2 py-3 md:min-h-0 md:flex-1 md:px-3 md:py-3">
                {currentImage ? (
                  <img
                    src={currentImage.url}
                    alt={`Generated page ${currentImage.pageIndex}`}
                    className="h-auto w-full max-w-[18.5rem] border border-[rgba(229,216,189,0.16)] object-contain shadow-[0_12px_30px_rgba(0,0,0,0.35)] md:h-full md:max-h-full md:w-auto md:max-w-full"
                  />
                ) : (
                  <div className="px-2 text-center font-mono text-[0.62rem] uppercase tracking-[0.18em] text-[var(--text-secondary)] md:text-[0.66rem] md:tracking-[0.2em]">
                    Generate to preview output
                  </div>
                )}
              </div>

              <div className="grid gap-3 md:flex md:flex-wrap md:items-center md:justify-between">
                <div className="flex items-center justify-between gap-2 md:justify-start">
                  <button
                    type="button"
                    onClick={goToPreviousImage}
                    disabled={!hasGeneratedImages}
                    className="flex h-10 w-10 items-center justify-center border border-[var(--border-soft)] text-[var(--text-primary)] transition-colors hover:border-[var(--accent-secondary)] disabled:cursor-not-allowed disabled:opacity-45"
                    aria-label="Previous preview image"
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={goToNextImage}
                    disabled={!hasGeneratedImages}
                    className="flex h-10 w-10 items-center justify-center border border-[var(--border-soft)] text-[var(--text-primary)] transition-colors hover:border-[var(--accent-secondary)] disabled:cursor-not-allowed disabled:opacity-45"
                    aria-label="Next preview image"
                  >
                    <ArrowRight size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap md:items-center">
                  <button
                    type="button"
                    onClick={downloadCurrentImage}
                    disabled={!currentImage}
                    className="w-full border border-[var(--border-soft)] px-3 py-2 text-center font-mono text-[0.6rem] uppercase tracking-[0.16em] text-[var(--text-primary)] transition-colors hover:border-[var(--accent-secondary)] disabled:cursor-not-allowed disabled:opacity-45 md:w-auto md:text-[0.64rem] md:tracking-[0.18em]"
                  >
                    Download Current
                  </button>
                  <button
                    type="button"
                    onClick={downloadAllImages}
                    disabled={!hasGeneratedImages || isDownloadingAll}
                    className="w-full border border-[var(--border-strong)] bg-[rgba(201,115,56,0.14)] px-3 py-2 text-center font-mono text-[0.6rem] uppercase tracking-[0.16em] text-[var(--text-primary)] transition-colors hover:border-[var(--accent-secondary)] hover:bg-[var(--accent-primary)] disabled:cursor-not-allowed disabled:opacity-45 md:w-auto md:text-[0.64rem] md:tracking-[0.18em]"
                  >
                    {isDownloadingAll ? 'Downloading…' : 'Download All'}
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
