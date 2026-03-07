import { submitRequest } from '../server/request-handler.mjs';

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
    response.status(400).json({ error: 'invalid_json' });
    return;
  }

  const result = await submitRequest({ payload, env: process.env });
  response.status(result.statusCode).json(result.body);
}
