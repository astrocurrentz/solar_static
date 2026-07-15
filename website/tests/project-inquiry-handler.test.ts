import { describe, expect, it, vi } from 'vitest';

import { submitProjectInquiry } from '../src/server/project-inquiry-handler';
import { createValidPayload } from './project-inquiry-fixture';

const env = {
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
  RESEND_API_KEY: 'resend-key',
  PROJECT_INQUIRY_FROM_EMAIL: 'Solar Static <inquiries@solarstatic.xyz>',
  PROJECT_INQUIRY_TO_EMAIL: 'studio@example.com',
};

describe('project inquiry handler', () => {
  it('rejects invalid payloads before making network requests', async () => {
    const fetchImpl = vi.fn<typeof fetch>();
    const result = await submitProjectInquiry({
      input: {},
      env,
      fetchImpl,
    });

    expect(result.statusCode).toBe(400);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('silently accepts honeypot submissions without persistence', async () => {
    const now = Date.now();
    const fetchImpl = vi.fn<typeof fetch>();
    const result = await submitProjectInquiry({
      input: { ...createValidPayload(now), website: 'spam.example' },
      env,
      fetchImpl,
      now,
    });

    expect(result.statusCode).toBe(202);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('returns an existing reference for an idempotent retry', async () => {
    const now = Date.now();
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            { reference_code: 'SSS-EXISTING', email_status: 'sent' },
          ]),
          { status: 200 },
        ),
      );
    const result = await submitProjectInquiry({
      input: createValidPayload(now),
      env,
      fetchImpl,
      now,
    });

    expect(result).toEqual({
      statusCode: 200,
      body: { ok: true, referenceCode: 'SSS-EXISTING' },
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('persists, notifies, and marks a successful inquiry as sent', async () => {
    const now = Date.now();
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response('[]', { status: 200 }))
      .mockResolvedValueOnce(new Response('[{}]', { status: 201 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 'email-id' }), { status: 200 }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }));

    const result = await submitProjectInquiry({
      input: createValidPayload(now),
      env,
      fetchImpl,
      now,
      createReferenceCode: () => 'SSS-NEW12345',
    });

    expect(result).toEqual({
      statusCode: 201,
      body: { ok: true, referenceCode: 'SSS-NEW12345' },
    });
    const resendRequest = fetchImpl.mock.calls[2];
    expect(resendRequest?.[0]).toBe('https://api.resend.com/emails');
    expect(String(resendRequest?.[1]?.body)).toContain('SSS-NEW12345');
    expect(String(fetchImpl.mock.calls[3]?.[1]?.body)).toContain('sent');
  });

  it('keeps the saved inquiry successful when notification fails', async () => {
    const now = Date.now();
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response('[]', { status: 200 }))
      .mockResolvedValueOnce(new Response('[{}]', { status: 201 }))
      .mockResolvedValueOnce(new Response('failed', { status: 500 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));

    const result = await submitProjectInquiry({
      input: createValidPayload(now),
      env,
      fetchImpl,
      now,
      createReferenceCode: () => 'SSS-SAVED123',
    });

    expect(result.statusCode).toBe(201);
    expect(String(fetchImpl.mock.calls[3]?.[1]?.body)).toContain('failed');
  });
});
