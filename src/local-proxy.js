const http = require("http");
const https = require("https");
const tls = require("tls");
const fs = require("fs");
const path = require("path");

const AUTH_SECRET = process.env.AUTH_SECRET;
const PORT = parseInt(process.env.PORT || "9090");

const workerUrl = new URL(process.env.WORKER_URL);
const WORKER_HOST = workerUrl.hostname;

const certsDir = path.join(__dirname, "..", "certs");
const serverKey = fs.readFileSync(path.join(certsDir, "server.key"));
const serverCert = fs.readFileSync(path.join(certsDir, "server.crt"));

const secureContext = tls.createSecureContext({ key: serverKey, cert: serverCert });

const internalServer = http.createServer((req, res) => {
  const targetUrl = `https://${req.headers.host}${req.url}`;
  console.log(`  ${req.method} ${targetUrl}`);

  const fwdHeaders = { ...req.headers };
  fwdHeaders["host"] = WORKER_HOST;
  fwdHeaders["x-target-url"] = targetUrl;
  fwdHeaders["x-auth-token"] = AUTH_SECRET;

  const proxyReq = https.request(
    {
      hostname: WORKER_HOST,
      port: 443,
      path: "/relay",
      method: req.method,
      headers: fwdHeaders,
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    }
  );

  proxyReq.on("error", (e) => {
    console.error(`  relay error: ${e.message}`);
    if (!res.headersSent) {
      res.writeHead(502);
      res.end("Bad Gateway");
    }
  });

  req.pipe(proxyReq);
});

const proxyServer = http.createServer((_req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("proxy running");
});

proxyServer.on("connect", (req, clientSocket) => {
  console.log(`CONNECT ${req.url}`);

  clientSocket.write("HTTP/1.1 200 Connection Established\r\n\r\n");

  const tlsSocket = new tls.TLSSocket(clientSocket, {
    isServer: true,
    SNICallback: (_servername, cb) => cb(null, secureContext),
  });

  internalServer.emit("connection", tlsSocket);
});

proxyServer.listen(PORT, "127.0.0.1", () => {
  console.log(`proxy listening on 127.0.0.1:${PORT}`);
});
