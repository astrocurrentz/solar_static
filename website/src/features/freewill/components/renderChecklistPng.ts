import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

export async function renderChecklistPng(data: ArrayBuffer): Promise<Blob> {
  GlobalWorkerOptions.workerSrc = workerUrl;
  const task = getDocument({ data });
  const canvas = document.createElement('canvas');
  try {
    const pdf = await task.promise;
    if (pdf.numPages !== 1) throw new Error('Expected a one-page checklist');
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 3 });
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    await page.render({ canvas, viewport, background: '#ffffff' }).promise;
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Could not encode the checklist as PNG'));
      }, 'image/png');
    });
  } finally {
    canvas.width = 0;
    canvas.height = 0;
    await task.destroy();
  }
}
