export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const token = request.headers.get("X-Auth-Token") || url.searchParams.get("auth");
    if (!env.AUTH_SECRET || token !== env.AUTH_SECRET) {
      return new Response("Unauthorized", { status: 401 });
    }

    url.searchParams.delete("auth");
    const targetUrl = "https://api.telegram.org" + url.pathname + url.search;

    const response = await fetch(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.method !== "GET" ? request.body : undefined,
    });

    return new Response(response.body, {
      status: response.status,
      headers: response.headers,
    });
  },
};
