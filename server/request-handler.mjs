const JSON_HEADERS = {
  'Content-Type': 'application/json',
};

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const hasSupabaseConfig = (env) => Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
const buildFallbackRequestNumber = () => {
  const timestamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
  const entropy = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${timestamp}${entropy}`;
};

const updateSubmissionStatus = async (submissionId, emailStatus, env, fetchImpl) => {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = env;

  await fetchImpl(`${SUPABASE_URL}/rest/v1/request_submissions?id=eq.${submissionId}`, {
    method: 'PATCH',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email_status: emailStatus }),
  });
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

export const submitRequest = async ({ payload, env, fetchImpl = fetch }) => {
  const email = typeof payload?.email === 'string' ? payload.email.trim() : '';
  const message = typeof payload?.message === 'string' ? payload.message.trim() : '';

  if (!email || !message || !isValidEmail(email)) {
    return {
      statusCode: 400,
      body: { error: 'invalid_request' },
    };
  }

  const {
    RESEND_API_KEY,
    REQUEST_FROM_EMAIL,
    REQUEST_TO_EMAIL = 'signal@solarstatic.xyz',
  } = env;

  if (!RESEND_API_KEY || !REQUEST_FROM_EMAIL) {
    return {
      statusCode: 500,
      body: { error: 'missing_env' },
    };
  }

  let submissionId;
  let requestNumber = buildFallbackRequestNumber();
  const shouldPersistSubmission = hasSupabaseConfig(env);

  try {
    if (shouldPersistSubmission) {
      try {
        const insertResponse = await fetchImpl(`${env.SUPABASE_URL}/rest/v1/request_submissions?select=id`, {
          method: 'POST',
          headers: {
            apikey: env.SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
            Prefer: 'return=representation',
          },
          body: JSON.stringify({
            email,
            message,
            email_status: 'pending',
          }),
        });

        if (!insertResponse.ok) {
          const insertError = await insertResponse.text();
          throw new Error(insertError || 'Failed to create submission');
        }

        const [record] = await insertResponse.json();
        submissionId = Number(record?.id);

        if (!Number.isFinite(submissionId)) {
          throw new Error('Invalid submission id');
        }

        requestNumber = String(submissionId).padStart(4, '0');
      } catch (error) {
        console.error('Supabase request logging unavailable, continuing with fallback request number.');
        console.error(error);
        submissionId = undefined;
      }
    }

    const resendResponse = await fetchImpl('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: REQUEST_FROM_EMAIL,
        to: [REQUEST_TO_EMAIL],
        subject: `SSS - Request #${requestNumber}`,
        text: `${email}\n\n${message}`,
      }),
    });

    if (!resendResponse.ok) {
      const resendError = await resendResponse.text();
      throw new Error(resendError || 'Failed to send request email');
    }

    if (submissionId) {
      await updateSubmissionStatus(submissionId, 'sent', env, fetchImpl);
    }

    return {
      statusCode: 200,
      body: {
        requestNumber,
        redirectTo: '/thanks',
      },
    };
  } catch (error) {
    if (submissionId && shouldPersistSubmission) {
      try {
        await updateSubmissionStatus(submissionId, 'failed', env, fetchImpl);
      } catch (updateError) {
        console.error(updateError);
      }
    }

    console.error(error);

    return {
      statusCode: 500,
      body: { error: 'send_failed' },
    };
  }
};
