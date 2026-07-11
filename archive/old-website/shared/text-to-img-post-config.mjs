export const TEXT_TO_IMG_POST_CONFIG = {
  endpoint: '/api/tools/text-to-img-post/render',
  outputWidth: 1440,
  outputHeight: 2400,
  maxTotalTextLength: 2500,
  maxTotalPageCount: 15,
  titlePageCount: 1,
  maxUnitsPerLine: 29,
  firstPageMaxLines: 18,
  continuationPageMaxLines: 24,
  bodyPadding: {
    top: 224,
    right: 108,
    bottom: 168,
    left: 108,
  },
  header: {
    minHeightTitle: 396,
    minHeightContinuation: 110,
    paddingTopTitle: 168,
    paddingBottomTitle: 52,
    paddingBottomContinuation: 34,
  },
  paragraph: {
    marginTopTitle: 52,
    marginTopContinuation: 40,
    padding: 72,
    textRightGuard: 14,
    fontSize: 50,
    lineHeight: 1.48,
    letterSpacingRatio: 0.015,
  },
  footer: {
    marginTop: 42,
    paddingTop: 28,
    textHeight: 34,
  },
  fontFiles: {
    syneBold: 'node_modules/@fontsource/syne/files/syne-latin-800-normal.woff',
    spaceMonoRegular: 'node_modules/@fontsource/space-mono/files/space-mono-latin-400-normal.woff',
    notoSansScRegular: 'node_modules/@fontsource/noto-sans-sc/files/noto-sans-sc-chinese-simplified-400-normal.woff',
    notoSansScBold: 'node_modules/@fontsource/noto-sans-sc/files/noto-sans-sc-chinese-simplified-700-normal.woff',
  },
};

export const getTextToImageContentPageCount = () => (
  TEXT_TO_IMG_POST_CONFIG.maxTotalPageCount - TEXT_TO_IMG_POST_CONFIG.titlePageCount
);

export const getTextToImageParagraphContentWidth = () => (
  TEXT_TO_IMG_POST_CONFIG.outputWidth
  - (TEXT_TO_IMG_POST_CONFIG.bodyPadding.left * 2)
  - (TEXT_TO_IMG_POST_CONFIG.paragraph.padding * 2)
  - TEXT_TO_IMG_POST_CONFIG.paragraph.textRightGuard
);

export const getTextToImageParagraphFont = () => (
  `400 ${TEXT_TO_IMG_POST_CONFIG.paragraph.fontSize}px "Space Mono", "Noto Sans SC"`
);
