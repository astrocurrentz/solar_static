export const JSON_HEADERS = {
  'Content-Type': 'application/json',
};

export const parseJsonPayload = (body) => {
  if (!body) {
    return {};
  }

  if (typeof body === 'string') {
    return JSON.parse(body);
  }

  return body;
};

export const createJsonBody = (body) => JSON.stringify(body);

export const createWebJsonResponse = (statusCode, body) => new Response(createJsonBody(body), {
  status: statusCode,
  headers: JSON_HEADERS,
});

export const createNetlifyJsonResponse = (statusCode, body) => ({
  statusCode,
  headers: JSON_HEADERS,
  body: createJsonBody(body),
});
