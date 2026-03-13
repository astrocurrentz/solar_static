import {
  TextToImageValidationError,
  renderTextToImagePost,
} from '../../server/text-to-img-post-renderer.mjs';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
};

const createJsonResponse = (statusCode, body) => ({
  statusCode,
  headers: JSON_HEADERS,
  body: JSON.stringify(body),
});

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return createJsonResponse(405, { error: 'method_not_allowed' });
  }

  let payload;
  try {
    payload = JSON.parse(event.body ?? '{}');
  } catch {
    return createJsonResponse(400, {
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
      return createJsonResponse(error.statusCode, {
        error: error.code,
        message: error.message,
      });
    }

    console.error(error);
    return createJsonResponse(500, {
      error: 'render_failed',
      message: 'Unable to render image.',
    });
  }
};

