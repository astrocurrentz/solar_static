import { submitProjectInquiry } from '../src/server/project-inquiry-handler';

type ApiRequest = {
  method?: string;
  body?: unknown;
};

type ApiResponse = {
  setHeader: (name: string, value: string) => void;
  status: (statusCode: number) => ApiResponse;
  json: (body: unknown) => void;
};

const parseBody = (body: unknown) => {
  if (typeof body !== 'string') return body;
  return JSON.parse(body) as unknown;
};

export default async function handler(
  request: ApiRequest,
  response: ApiResponse,
) {
  response.setHeader('Cache-Control', 'no-store');

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    response.status(405).json({ ok: false, error: 'method_not_allowed' });
    return;
  }

  let input: unknown;
  try {
    input = parseBody(request.body);
  } catch {
    response.status(400).json({ ok: false, error: 'invalid_json' });
    return;
  }

  const result = await submitProjectInquiry({
    input,
    env: {
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      RESEND_API_KEY: process.env.RESEND_API_KEY,
      PROJECT_INQUIRY_FROM_EMAIL: process.env.PROJECT_INQUIRY_FROM_EMAIL,
      PROJECT_INQUIRY_TO_EMAIL: process.env.PROJECT_INQUIRY_TO_EMAIL,
    },
  });

  response.status(result.statusCode).json(result.body);
}
