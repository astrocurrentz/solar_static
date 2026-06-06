import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import GlitchText from './GlitchText';
import { SITE_COPY } from '../shared/copy/site-copy.mjs';
import {
  MAX_CONTENT_PAGE_COUNT,
  MAX_TOTAL_PAGE_COUNT,
  MAX_TOTAL_TEXT_LENGTH,
  TEXT_TO_IMG_RENDER_ENDPOINT,
} from './tools/textToImageConfig';
import { openPhotoSaveWindow, shareFilesIfSupported, triggerBlobDownload, wait } from './tools/downloads';
import { paginateTextBySentence } from './tools/textToImagePagination';
import type { GeneratedToolImage, ToolsLauncherCardProps } from './tools/types';

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
          <section className="w-full border border-[var(--border-soft)] bg-[var(--request-dark-020)]">
            <button
              type="button"
              onClick={onOpenTextToImagePost}
              className="block w-full text-left transition-colors duration-300 hover:bg-[var(--request-copper-008)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--accent-secondary)]"
              aria-label="Open text_to_img_post tool"
            >
              <div className="grid gap-3 px-5 py-4 md:px-7 md:py-5">
                <GlitchText
                  text="text_to_img_post"
                  wrapToWidth={false}
                  className="font-display text-[clamp(1.4rem,3.5vw,2.3rem)] font-black tracking-[0.04em] text-[var(--text-primary)]"
                />
                <div className="border border-[var(--border-soft)] bg-[var(--request-dark-018)] px-4 py-3 font-mono text-[0.68rem] uppercase tracking-[0.16em] text-[var(--text-secondary)] md:text-[0.72rem]">
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
      setErrorMessage(SITE_COPY.tools.tooLongTemplate(MAX_TOTAL_PAGE_COUNT));
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
        <header className="grid gap-2 border border-[var(--border-soft)] bg-[var(--request-dark-020)] px-3 py-3 md:items-end md:gap-5 md:px-7 md:py-5">
          <div className="min-w-0">
            <GlitchText
              text="TEXT_TO_IMG_POST"
              wrapToWidth={false}
              className="block font-display text-[clamp(1rem,7vw,1.55rem)] font-black tracking-[0.04em] text-[var(--text-primary)] md:text-[clamp(1.2rem,3.2vw,2.3rem)] md:tracking-[0.05em]"
            />
          </div>
        </header>

        <div className="grid gap-3 md:min-h-0 md:flex-1 md:grid-cols-[minmax(22rem,28rem)_minmax(0,1fr)] md:gap-5">
          <section className="flex flex-col border border-[var(--border-soft)] bg-[var(--request-dark-020)] md:min-h-0">
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
                  className="w-full border border-[var(--border-soft)] bg-[var(--request-dark-022)] px-3 py-3 font-mono text-[16px] tracking-[0.06em] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:border-[var(--accent-secondary)] focus:outline-none md:text-sm"
                />
              </label>

              <label className="grid gap-2">
                <span className="font-mono text-[0.63rem] uppercase tracking-[0.2em] text-[var(--text-secondary)]">Paragraph</span>
                <textarea
                  value={paragraph}
                  onChange={(event) => setParagraph(event.target.value)}
                  placeholder="Paste or write paragraph content..."
                  rows={10}
                  className="h-[11rem] resize-none border border-[var(--border-soft)] bg-[var(--request-dark-022)] px-3 py-3 font-mono text-[16px] leading-relaxed tracking-[0.05em] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:border-[var(--accent-secondary)] focus:outline-none md:h-[16rem] md:text-sm"
                />
              </label>

              <div className="flex flex-wrap items-center justify-between gap-2 border border-[var(--border-soft)] bg-[var(--request-dark-016)] px-3 py-2 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                <span>Total Characters</span>
                <span className={totalTextLength > MAX_TOTAL_TEXT_LENGTH ? 'text-[var(--accent-secondary)]' : 'text-[var(--text-primary)]'}>
                  {totalTextLength} / {MAX_TOTAL_TEXT_LENGTH}
                </span>
              </div>
              <p className="font-mono text-[0.58rem] uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                {SITE_COPY.tools.maxOutputTemplate(MAX_TOTAL_PAGE_COUNT)}
              </p>

              {errorMessage && (
                <p className="border border-[var(--accent-secondary)] bg-[var(--request-copper-008)] px-3 py-2 font-mono text-[0.66rem] uppercase tracking-[0.14em] text-[var(--accent-secondary)]">
                  {errorMessage}
                </p>
              )}

              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full border border-[var(--border-strong)] bg-[var(--request-copper-014)] px-4 py-3 font-mono text-[0.68rem] uppercase tracking-[0.2em] text-[var(--text-primary)] transition-colors hover:border-[var(--accent-secondary)] hover:bg-[var(--accent-primary)] disabled:cursor-wait disabled:opacity-70"
              >
                {isGenerating ? 'Generating…' : 'Generate Images'}
              </button>
            </div>
          </section>

          <section className="flex flex-col border border-[var(--border-soft)] bg-[var(--request-dark-020)] md:min-h-0">
            <div className="flex items-center justify-between gap-3 border-b border-[var(--border-soft)] px-3 py-2.5 font-mono text-[0.61rem] uppercase tracking-[0.2em] text-[var(--text-secondary)] md:px-5 md:py-3 md:text-[0.64rem] md:tracking-[0.22em]">
              <span>Carousel Preview</span>
              <span className="text-[var(--text-primary)]">
                {hasGeneratedImages ? `${activeImageIndex + 1}/${generatedImages.length}` : '0/0'}
              </span>
            </div>

            <div className="flex flex-col gap-3 p-3 md:min-h-0 md:flex-1 md:gap-4 md:p-5">
              <div className="relative flex min-h-[18.5rem] items-center justify-center border border-[var(--border-soft)] bg-[var(--request-dark-018)] px-2 py-3 md:min-h-0 md:flex-1 md:px-3 md:py-3">
                {currentImage ? (
                  <img
                    src={currentImage.url}
                    alt={`Generated page ${currentImage.pageIndex}`}
                    className="h-auto w-full max-w-[18.5rem] border border-[var(--request-cream-016)] object-contain shadow-[0_12px_30px_var(--popup-image-shadow)] md:h-full md:max-h-full md:w-auto md:max-w-full"
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
                    className="w-full border border-[var(--border-strong)] bg-[var(--request-copper-014)] px-3 py-2 text-center font-mono text-[0.6rem] uppercase tracking-[0.16em] text-[var(--text-primary)] transition-colors hover:border-[var(--accent-secondary)] hover:bg-[var(--accent-primary)] disabled:cursor-not-allowed disabled:opacity-45 md:w-auto md:text-[0.64rem] md:tracking-[0.18em]"
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
