import { createServerClient } from '@supabase/ssr';
import type { APIContext } from 'astro';
import { parseCookie } from 'cookie';

export function allowedAdmin(userId: string) {
  return (process.env.FREEWILL_ADMIN_USER_IDS ?? '')
    .split(',')
    .some((id) => id.trim() === userId);
}

export function sessionClient(context: APIContext) {
  const url = process.env.FREEWILL_SUPABASE_URL;
  const key = process.env.FREEWILL_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key || !process.env.FREEWILL_ADMIN_USER_IDS?.trim()) {
    throw new Error('FREEWILL auth configuration is missing');
  }

  return createServerClient(url, key, {
    cookieOptions: {
      name: 'freewill-session',
      path: '/api/freewill',
      httpOnly: true,
      secure: import.meta.env.PROD || context.url.protocol === 'https:',
      sameSite: 'lax',
    },
    cookies: {
      getAll: () =>
        Object.entries(
          parseCookie(context.request.headers.get('cookie') ?? ''),
        ).flatMap(([name, value]) =>
          value === undefined ? [] : [{ name, value }],
        ),
      setAll: (cookies) => {
        for (const { name, value, options } of cookies) {
          context.cookies.set(name, value, options);
        }
      },
    },
  });
}
