import {
  TextToImageValidationError,
  renderTextToImagePost,
} from '../../server/text-to-img-post-renderer.mjs';
import {
  createNetlifyJsonResponse,
  parseJsonPayload,
} from '../../shared/http/adapter-utils.mjs';

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return createNetlifyJsonResponse(405, { error: 'method_not_allowed' });
  }

  let payload;
  try {
    payload = parseJsonPayload(event.body);
  } catch {
    return createNetlifyJsonResponse(400, {
      error: 'invalid_json',
      message: 'Request body must be valid JSON.',
    });
  }

  try {
    const pngBytes = await renderTextToImagePost(payload);
    return {
      statusCode: 200,
      isBase64Encoded: true,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-store',
      },
      body: Buffer.from(pngBytes).toString('base64'),
    };
  } catch (error) {
    if (error instanceof TextToImageValidationError) {
      return createNetlifyJsonResponse(error.statusCode, {
        error: error.code,
        message: error.message,
      });
    }

    console.error(error);
    return createNetlifyJsonResponse(500, {
      error: 'render_failed',
      message: 'Unable to render image.',
    });
  }
};
