import { SITE_COPY } from '../../shared/copy/site-copy.mjs';
import { APP_CSS_VARIABLES, FONT_STACKS } from '../../shared/design/tokens.mjs';

export const triggerBlobDownload = (blob: Blob, filename: string) => {
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

export const wait = (durationMs: number) => new Promise((resolve) => {
  window.setTimeout(resolve, durationMs);
});

export const shareFilesIfSupported = async (files: File[], shareTitle: string) => {
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
      reject(new Error(SITE_COPY.tools.encodeImageError));
    }
  };
  reader.onerror = () => reject(new Error(SITE_COPY.tools.encodeImageError));
  reader.readAsDataURL(blob);
});

export const openPhotoSaveWindow = async (images: Array<{ filename: string; blob: Blob }>) => {
  if (typeof window === 'undefined') {
    return false;
  }

  const popup = window.open('', '_blank');
  if (!popup) {
    return false;
  }

  const popupBodyStyle = [
    'margin:0',
    `background:${APP_CSS_VARIABLES['--popup-background']}`,
    `color:${APP_CSS_VARIABLES['--popup-foreground']}`,
    `font-family:${FONT_STACKS.monoSystem}`,
    'padding:16px',
  ].join(';');

  popup.document.write(`<!doctype html><title>${SITE_COPY.tools.popupTitle}</title><meta name="viewport" content="width=device-width,initial-scale=1" /><body style="${popupBodyStyle};">${SITE_COPY.tools.popupPreparing}</body>`);

  try {
    const encoded = await Promise.all(images.map(async (image) => ({
      filename: image.filename,
      src: await blobToDataUrl(image.blob),
    })));

    const cards = encoded.map((image, index) => `
      <article style="margin:0 0 20px 0;padding:12px;border:1px solid ${APP_CSS_VARIABLES['--popup-border-strong']};background:${APP_CSS_VARIABLES['--popup-panel']};">
        <div style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;opacity:0.85;margin-bottom:10px;">${SITE_COPY.tools.popupImageLabel} ${index + 1}: ${image.filename}</div>
        <img src="${image.src}" alt="${image.filename}" style="width:100%;height:auto;display:block;border:1px solid ${APP_CSS_VARIABLES['--popup-border-soft']};" />
      </article>
    `).join('');

    popup.document.body.innerHTML = `
      <main style="max-width:680px;margin:0 auto;">
        <h1 style="margin:0 0 12px 0;font-size:16px;letter-spacing:0.1em;text-transform:uppercase;">${SITE_COPY.tools.popupHeading}</h1>
        <p style="margin:0 0 16px 0;font-size:13px;line-height:1.5;opacity:0.85;">${SITE_COPY.tools.popupInstructions}</p>
        ${cards}
      </main>
    `;
    return true;
  } catch {
    popup.close();
    return false;
  }
};
