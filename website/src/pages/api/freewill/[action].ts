import type { APIRoute } from 'astro';
import { loadAlbum, saveEdit } from '../../../server/freewill/database';
import { createCsv } from '../../../server/freewill/export';
import { allowedAdmin, sessionClient } from '../../../server/freewill/session';
import { parseEdit, record } from '../../../server/freewill/validation';

export const prerender = false;

const privateHeaders = {
  'Cache-Control': 'private, no-store',
  'X-Content-Type-Options': 'nosniff',
};

const reply = (body: object, status = 200) =>
  Response.json(body, { status, headers: privateHeaders });
const fail = (error: string, status: number) => reply({ error }, status);

const methods = new Map([
  ['album', 'GET'],
  ['edit', 'PATCH'],
  ['login', 'POST'],
  ['logout', 'POST'],
  ['export', 'GET'],
]);

export const ALL: APIRoute = async (context) => {
  const { request, params, url } = context;
  const action = params.action ?? '';
  const method = methods.get(action);
  if (!method) return fail('not_found', 404);
  if (request.method !== method) {
    return new Response(null, {
      status: 405,
      headers: { ...privateHeaders, Allow: method },
    });
  }
  if (method !== 'GET' && request.headers.get('origin') !== url.origin) {
    return fail('invalid_origin', 403);
  }

  try {
    const auth = sessionClient(context);
    if (action === 'login') {
      const { email, password } = record(
        await request.json().catch(() => null),
      );
      if (
        typeof email !== 'string' ||
        !email.trim() ||
        email.length > 254 ||
        typeof password !== 'string' ||
        !password ||
        password.length > 1024
      ) {
        return fail('invalid_credentials', 400);
      }
      const { data, error } = await auth.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error?.status === 429) return fail('rate_limited', 429);
      if (error && (error.status ?? 500) >= 500)
        return fail('unavailable', 503);
      if (error || !data.user) return fail('invalid_credentials', 401);
      if (!allowedAdmin(data.user.id)) {
        await auth.auth.signOut({ scope: 'local' });
        return fail('invalid_credentials', 401);
      }
      return reply({ ok: true });
    }

    if (action === 'logout') {
      const { error } = await auth.auth.signOut({ scope: 'local' });
      if (error) return fail('unavailable', 503);
      return reply({ ok: true });
    }

    const {
      data: { user },
      error,
    } = await auth.auth.getUser();
    if (error && (error.status ?? 500) >= 500) return fail('unavailable', 503);
    if (!user) return fail('sign_in_required', 401);
    if (!allowedAdmin(user.id)) return fail('forbidden', 403);

    if (action === 'edit') {
      const edit = parseEdit(await request.json().catch(() => null));
      if (!edit) return fail('invalid_edit', 400);
      if (!(await saveEdit(edit))) return fail('not_found', 404);
      return reply({ edit });
    }
    if (action === 'album') return reply(await loadAlbum());

    const format = url.searchParams.get('format');
    if (format !== 'csv' && format !== 'json' && format !== 'pdf') {
      return fail('invalid_format', 400);
    }
    const album = await loadAlbum();
    const headers = {
      ...privateHeaders,
      'Content-Disposition': `attachment; filename="freewill-album.${format}"`,
    };

    if (format === 'pdf') {
      const { createPdf } = await import('../../../server/freewill/pdf');
      return new Response(await createPdf(album), {
        headers: { ...headers, 'Content-Type': 'application/pdf' },
      });
    }
    if (format === 'csv') {
      return new Response(createCsv(album), {
        headers: { ...headers, 'Content-Type': 'text/csv; charset=utf-8' },
      });
    }
    return Response.json(album, { headers });
  } catch (error) {
    console.error(
      'FREEWILL request failed',
      action,
      error instanceof Error ? error.name : 'database',
    );
    return fail('unavailable', 503);
  }
};
