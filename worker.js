import { handleRequest } from './functions/api/send-email.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/send-email' || url.pathname === '/api/send-email/') {
      return handleRequest(request, env);
    }

    if (url.pathname.startsWith('/api/')) {
      return new Response(JSON.stringify({ ok: false, message: 'Không tìm thấy API.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    return env.ASSETS.fetch(request);
  }
};
