/* Launches the Nitro server in production mode for Electron to connect to. */
const { createServer } = require("node:http");
const net = require("node:net");
const path = require("node:path");

async function findFreePort(start = 3000) {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on("error", reject);
    srv.listen(start, () => {
      const port = srv.address().port;
      srv.close(() => resolve(port));
    });
  });
}

async function startNorthServer(preferredPort) {
  const serverPath = path.join(process.cwd(), ".output", "server", "index.mjs");
  const serverModule = await import(serverPath);
  const handler = serverModule.default || serverModule;

  if (!handler || typeof handler.fetch !== "function") {
    throw new Error("Nitro server entry not found in .output/server/index.mjs");
  }

  const port = preferredPort || (await findFreePort(3147));

  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, `http://localhost:${port}`);
      const headers = {};
      for (const [key, value] of Object.entries(req.headers)) {
        if (Array.isArray(value)) headers[key] = value.join(", ");
        else if (value) headers[key] = value;
      }
      const body = ["GET", "HEAD"].includes(req.method || "GET")
        ? undefined
        : await readBody(req);

      const response = await handler.fetch(
        new Request(url.toString(), {
          method: req.method,
          headers,
          body,
        }),
        { port },
      );

      res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
      const buf = Buffer.from(await response.arrayBuffer());
      res.end(buf);
    } catch (err) {
      console.error("North server error:", err);
      res.writeHead(500);
      res.end("Internal Server Error");
    }
  });

  return new Promise((resolve, reject) => {
    server.on("error", reject);
    server.listen(port, "127.0.0.1", () => {
      console.log(`North server running on http://127.0.0.1:${port}`);
      resolve(port);
    });
  });
}

function readBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
  });
}

module.exports = { startNorthServer };
