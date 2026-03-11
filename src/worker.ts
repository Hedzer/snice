export default {
  async fetch(request: Request, env: any) {
    const response = await env.ASSETS.fetch(request);
    const url = new URL(request.url);

    // Stamped assets (?v=hash): immutable, cache forever
    if (url.searchParams.has('v')) {
      const headers = new Headers(response.headers);
      headers.set('Cache-Control', 'public, max-age=31536000, immutable');
      return new Response(response.body, { status: response.status, headers });
    }

    return response;
  },
};
