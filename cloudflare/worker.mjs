const backend = 'https://gather-backend-t3g1.onrender.com';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
      const target = new URL(url.pathname + url.search, backend);
      try {
        // Preserve cookies, Origin, body and Range; stream voice bytes unchanged.
        const upstream = await fetch(new Request(target, request), { redirect: 'manual' });
        const response = new Response(upstream.body, upstream);
        response.headers.set('Cache-Control', 'no-store');
        return response;
      } catch {
        return Response.json({ message: 'Cannot connect to Gather. Please try again.' }, {
          status: 502, headers: { 'Cache-Control': 'no-store' },
        });
      }
    }
    return env.ASSETS.fetch(request);
  },
};
