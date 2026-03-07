const jsonResponse = (statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(body),
});

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const updateSubmissionStatus = async (submissionId, emailStatus, env) => {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = env;

  await fetch(`${SUPABASE_URL}/rest/v1/request_submissions?id=eq.${submissionId}`, {
    method: 'PATCH',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email_status: emailStatus }),
  });
};

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'method_not_allowed' });
  }

  let payload;
  try {
    payload = JSON.parse(event.body ?? '{}');
  } catch {
    return jsonResponse(400, { error: 'invalid_json' });
  }

  const email = typeof payload.email === 'string' ? payload.email.trim() : '';
  const message = typeof payload.message === 'string' ? payload.message.trim() : '';

  if (!email || !message || !isValidEmail(email)) {
    return jsonResponse(400, { error: 'invalid_request' });
  }

  const {
    RESEND_API_KEY,
    REQUEST_FROM_EMAIL,
    REQUEST_TO_EMAIL = 'solarstatic.studio@gmail.com',
    SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_URL,
  } = process.env;

  if (!RESEND_API_KEY || !REQUEST_FROM_EMAIL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_URL) {
    return jsonResponse(500, { error: 'missing_env' });
  }

  let submissionId;
  let requestNumber = '';

  try {
    const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/request_submissions?select=id`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
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

    const resendResponse = await fetch('https://api.resend.com/emails', {
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

    await updateSubmissionStatus(submissionId, 'sent', process.env);

    return jsonResponse(200, {
      requestNumber,
      redirectTo: '/thanks',
    });
  } catch (error) {
    if (submissionId) {
      try {
        await updateSubmissionStatus(submissionId, 'failed', process.env);
      } catch (updateError) {
        console.error(updateError);
      }
    }

    console.error(error);
    return jsonResponse(500, { error: 'send_failed' });
  }
};
