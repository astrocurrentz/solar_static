import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import React from 'react';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const OUTPUT_WIDTH = 1440;
const OUTPUT_HEIGHT = 2400;
const MAX_TOTAL_TEXT_LENGTH = 2500;
const MAX_TOTAL_PAGE_COUNT = 15;
const TITLE_PAGE_COUNT = 1;
const MAX_IMAGE_COUNT = MAX_TOTAL_PAGE_COUNT - TITLE_PAGE_COUNT;

const TEXT_COLOR = '#e5d8bd';
const ACCENT_COLOR = '#c97338';

const BODY_PADDING = {
  top: 224,
  right: 108,
  bottom: 168,
  left: 108,
};
const HEADER_MIN_HEIGHT_TITLE = 396;
const HEADER_MIN_HEIGHT_CONTINUATION = 110;
const HEADER_PADDING_TOP_TITLE = 168;
const HEADER_PADDING_BOTTOM_TITLE = 52;
const HEADER_PADDING_BOTTOM_CONTINUATION = 34;
const PARAGRAPH_MARGIN_TOP_TITLE = 52;
const PARAGRAPH_MARGIN_TOP_CONTINUATION = 40;
const PARAGRAPH_BOX_PADDING = 72;
const PARAGRAPH_TEXT_RIGHT_GUARD = 14;
const FOOTER_MARGIN_TOP = 42;
const FOOTER_PADDING_TOP = 28;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const FONT_FILES = {
  syneBold: 'node_modules/@fontsource/syne/files/syne-latin-800-normal.woff',
  spaceMonoRegular: 'node_modules/@fontsource/space-mono/files/space-mono-latin-400-normal.woff',
  notoSansScRegular: 'node_modules/@fontsource/noto-sans-sc/files/noto-sans-sc-chinese-simplified-400-normal.woff',
  notoSansScBold: 'node_modules/@fontsource/noto-sans-sc/files/noto-sans-sc-chinese-simplified-700-normal.woff',
};

const h = React.createElement;

class TextToImageValidationError extends Error {
  constructor(message, code = 'invalid_request', statusCode = 400) {
    super(message);
    this.name = 'TextToImageValidationError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

let fontCachePromise;
const loadFonts = async () => {
  if (!fontCachePromise) {
    fontCachePromise = Promise.all([
      fs.readFile(path.resolve(projectRoot, FONT_FILES.syneBold)),
      fs.readFile(path.resolve(projectRoot, FONT_FILES.spaceMonoRegular)),
      fs.readFile(path.resolve(projectRoot, FONT_FILES.notoSansScRegular)),
      fs.readFile(path.resolve(projectRoot, FONT_FILES.notoSansScBold)),
    ]).then(([syneBold, spaceMonoRegular, notoSansScRegular, notoSansScBold]) => ([
      {
        name: 'Syne',
        data: syneBold,
        weight: 800,
        style: 'normal',
      },
      {
        name: 'Space Mono',
        data: spaceMonoRegular,
        weight: 400,
        style: 'normal',
      },
      {
        name: 'Noto Sans SC',
        data: notoSansScRegular,
        weight: 400,
        style: 'normal',
      },
      {
        name: 'Noto Sans SC',
        data: notoSansScBold,
        weight: 700,
        style: 'normal',
      },
    ]));
  }

  return fontCachePromise;
};

const normalizeTextField = (value) => (typeof value === 'string' ? value.trim() : '');

export const validateTextToImageRenderPayload = (payload) => {
  const title = normalizeTextField(payload?.title);
  const paragraph = normalizeTextField(payload?.paragraph);
  const pageIndex = Number.parseInt(String(payload?.pageIndex ?? ''), 10);
  const pageCount = Number.parseInt(String(payload?.pageCount ?? ''), 10);
  const totalTextLength = title.length + paragraph.length;

  if (!title || !paragraph) {
    throw new TextToImageValidationError('Both title and paragraph are required.');
  }

  if (totalTextLength > MAX_TOTAL_TEXT_LENGTH) {
    throw new TextToImageValidationError(`Total text must be within ${MAX_TOTAL_TEXT_LENGTH} characters.`);
  }

  if (!Number.isFinite(pageIndex) || !Number.isFinite(pageCount)) {
    throw new TextToImageValidationError('Invalid page metadata.');
  }

  if (pageIndex < 1 || pageCount < 1 || pageCount > MAX_IMAGE_COUNT || pageIndex > pageCount) {
    throw new TextToImageValidationError(
      `Page metadata must stay within 1..${MAX_IMAGE_COUNT} content pages (${MAX_TOTAL_PAGE_COUNT} total including title).`,
    );
  }

  return {
    title,
    paragraph,
    pageIndex,
    pageCount,
  };
};

const buildSceneTree = ({ title, paragraph, pageIndex, pageCount }) => {
  const isTitlePage = pageIndex === 1;

  return h(
    'div',
    {
      style: {
        width: `${OUTPUT_WIDTH}px`,
        height: `${OUTPUT_HEIGHT}px`,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        color: TEXT_COLOR,
        background: '#282119',
      },
    },
    h('div', {
      style: {
        position: 'absolute',
        display: 'flex',
        inset: '0',
        background: 'linear-gradient(135deg, #282119 0%, #282119 52%, #65371f 100%)',
      },
    }),
    h('div', {
      style: {
        position: 'absolute',
        display: 'flex',
        inset: '0',
        opacity: 0.35,
        backgroundImage: 'linear-gradient(to right, rgba(229,216,189,0.14) 1px, transparent 1px), linear-gradient(to bottom, rgba(229,216,189,0.14) 1px, transparent 1px)',
        backgroundSize: '70px 70px',
      },
    }),
    h('div', {
      style: {
        position: 'absolute',
        display: 'flex',
        inset: '0',
        opacity: 0.2,
        backgroundImage: 'linear-gradient(to right, rgba(201,115,56,0.18) 1px, transparent 1px), linear-gradient(to bottom, rgba(201,115,56,0.18) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      },
    }),
    h(
      'div',
      {
        style: {
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          padding: `${BODY_PADDING.top}px ${BODY_PADDING.right}px ${BODY_PADDING.bottom}px ${BODY_PADDING.left}px`,
          boxSizing: 'border-box',
        },
      },
      h(
        'div',
        {
          style: {
            display: 'flex',
            borderBottom: '1px solid rgba(229,216,189,0.2)',
            paddingTop: isTitlePage ? `${HEADER_PADDING_TOP_TITLE}px` : '0px',
            paddingBottom: isTitlePage ? `${HEADER_PADDING_BOTTOM_TITLE}px` : `${HEADER_PADDING_BOTTOM_CONTINUATION}px`,
            minHeight: isTitlePage ? `${HEADER_MIN_HEIGHT_TITLE}px` : `${HEADER_MIN_HEIGHT_CONTINUATION}px`,
            boxSizing: 'border-box',
          },
        },
        isTitlePage
          ? h(
              'span',
              {
                style: {
                  display: 'block',
                  maxWidth: '970px',
                  fontFamily: 'Syne',
                  fontWeight: 800,
                  fontSize: '114px',
                  lineHeight: 1.24,
                  letterSpacing: '0.038em',
                  whiteSpace: 'pre-wrap',
                },
              },
              title.toUpperCase(),
            )
          : h('span', { style: { display: 'block', width: '1px', height: '1px' } }, ''),
      ),
      h(
        'div',
        {
          style: {
            marginTop: isTitlePage ? `${PARAGRAPH_MARGIN_TOP_TITLE}px` : `${PARAGRAPH_MARGIN_TOP_CONTINUATION}px`,
            border: '1px solid rgba(229,216,189,0.2)',
            background: 'rgba(8,8,8,0.2)',
            padding: `${PARAGRAPH_BOX_PADDING}px`,
            display: 'flex',
            flex: '1',
            minHeight: '0',
            boxSizing: 'border-box',
            overflow: 'hidden',
          },
        },
          h(
            'div',
            {
              style: {
                position: 'relative',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'flex-start',
                width: '100%',
                height: '100%',
                paddingRight: `${PARAGRAPH_TEXT_RIGHT_GUARD}px`,
                boxSizing: 'border-box',
              },
            },
            h(
              'p',
              {
                style: {
                  margin: '0',
                  width: '100%',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  overflowWrap: 'anywhere',
                  fontFamily: 'Space Mono, Noto Sans SC',
                  fontSize: '50px',
                  lineHeight: 1.48,
                letterSpacing: '0.015em',
                color: TEXT_COLOR,
              },
            },
            paragraph,
          ),
        ),
      ),
      h(
        'div',
        {
          style: {
            marginTop: `${FOOTER_MARGIN_TOP}px`,
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            borderTop: '1px solid rgba(229,216,189,0.2)',
            paddingTop: `${FOOTER_PADDING_TOP}px`,
          },
        },
        h(
          'span',
          {
            style: {
              fontFamily: 'Space Mono, Noto Sans SC',
              fontSize: '28px',
              letterSpacing: '0.22em',
              color: ACCENT_COLOR,
            },
          },
          `${String(pageIndex).padStart(2, '0')} / ${String(pageCount).padStart(2, '0')}`,
        ),
      ),
    ),
  );
};

export const renderTextToImagePost = async (payload) => {
  const validatedPayload = validateTextToImageRenderPayload(payload);
  const fonts = await loadFonts();
  const svgMarkup = await satori(buildSceneTree(validatedPayload), {
    width: OUTPUT_WIDTH,
    height: OUTPUT_HEIGHT,
    fonts,
  });
  const renderer = new Resvg(svgMarkup, {
    fitTo: {
      mode: 'width',
      value: OUTPUT_WIDTH,
    },
  });
  return renderer.render().asPng();
};

export {
  MAX_IMAGE_COUNT,
  MAX_TOTAL_PAGE_COUNT,
  MAX_TOTAL_TEXT_LENGTH,
  OUTPUT_HEIGHT,
  OUTPUT_WIDTH,
  TextToImageValidationError,
  TITLE_PAGE_COUNT,
};
