const BACKENDS = {
  "/telegram": "https://api.telegram.org",
  "/anthropic": "https://api.anthropic.com",
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const token = request.headers.get("X-Auth-Token") || url.searchParams.get("auth");
    if (!env.AUTH_SECRET || token !== env.AUTH_SECRET) {
      return new Response("Unauthorized", { status: 401 });
    }

    url.searchParams.delete("auth");

    const prefix = Object.keys(BACKENDS).find((p) => url.pathname === p || url.pathname.startsWith(p + "/"));
    if (!prefix) {
      return new Response("Not Found", { status: 404 });
    }

    const backend = BACKENDS[prefix];
    const path = url.pathname.slice(prefix.length) || "/";
    const targetUrl = backend + path + url.search;

    const headers = new Headers(request.headers);
    headers.delete("Host");
    headers.delete("X-Auth-Token");

    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: request.method !== "GET" ? request.body : undefined,
    });

    return new Response(response.body, {
      status: response.status,
      headers: response.headers,
    });
  },
};
