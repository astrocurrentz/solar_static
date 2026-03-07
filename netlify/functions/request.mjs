import { createNetlifyJsonResponse, submitRequest } from '../../server/request-handler.mjs';

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return createNetlifyJsonResponse(405, { error: 'method_not_allowed' });
  }

  let payload;
  try {
    payload = JSON.parse(event.body ?? '{}');
  } catch {
    return createNetlifyJsonResponse(400, { error: 'invalid_json' });
  }

  const result = await submitRequest({ payload, env: process.env });
  return createNetlifyJsonResponse(result.statusCode, result.body);
};
