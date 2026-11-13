import { createServerClient } from '@supabase/ssr';
import type { APIContext } from 'astro';
import { parseCookie } from 'cookie';

export function sessionClient(context: APIContext) {
  const url = process.env.FREEWILL_SUPABASE_URL;
  const key = process.env.FREEWILL_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error('FREEWILL auth configuration is missing');
  }

  return createServerClient(url, key, {
    db: { schema: 'core' },
    cookieOptions: {
      name: 'freewill-session',
      path: context.url.pathname.replace(/\/[^/]+\/?$/, ''),
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

export async function allowedAdmin(
  client: ReturnType<typeof sessionClient>,
  userId: string,
) {
  const { data, error } = await client
    .from('freewill_admins')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data !== null;
}
