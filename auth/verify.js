export function verifyAuth(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({
      error: { message: 'Missing or invalid Authorization header', type: 'invalid_request_error' }
    }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }
  const token = authHeader.substring(7);
  if (token !== env.API_KEY) {
    return new Response(JSON.stringify({
      error: { message: 'Invalid API key', type: 'invalid_request_error' }
    }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }
  return null; // success
}
