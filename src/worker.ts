export default {
  async fetch(request: Request, env: any) {
    const response = await env.ASSETS.fetch(request);
    const url = new URL(request.url);
    const headers = new Headers(response.headers);

    if (url.searchParams.has('v')) {
      // Stamped assets (?v=hash): immutable, cache forever
      headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (
      response.headers.get('Content-Type')?.includes('text/html')
    ) {
      // HTML pages: always revalidate (304 via ETag is cheap)
      headers.set('Cache-Control', 'public, no-cache');
    }

    return new Response(response.body, { status: response.status, headers });
  },
};
