import { submitRequest } from '../server/request-handler.mjs';
import { parseJsonPayload } from '../shared/http/adapter-utils.mjs';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  let payload;
  try {
    payload = parseJsonPayload(request.body);
  } catch {
    response.status(400).json({ error: 'invalid_json' });
    return;
  }

  const result = await submitRequest({ payload, env: process.env });
  response.status(result.statusCode).json(result.body);
}
