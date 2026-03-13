import {
  TextToImageValidationError,
  renderTextToImagePost,
} from '../../../server/text-to-img-post-renderer.mjs';

const parsePayload = (body) => {
  if (!body) {
    return {};
  }

  if (typeof body === 'string') {
    return JSON.parse(body);
  }

  return body;
};

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  let payload;
  try {
    payload = parsePayload(request.body);
  } catch {
    response.status(400).json({ error: 'invalid_json', message: 'Request body must be valid JSON.' });
    return;
  }

  try {
    const pngBytes = await renderTextToImagePost(payload);
    response.setHeader('Content-Type', 'image/png');
    response.setHeader('Cache-Control', 'no-store');
    response.status(200).send(Buffer.from(pngBytes));
  } catch (error) {
    if (error instanceof TextToImageValidationError) {
      response.status(error.statusCode).json({ error: error.code, message: error.message });
      return;
    }

    console.error(error);
    response.status(500).json({ error: 'render_failed', message: 'Unable to render image.' });
  }
}

