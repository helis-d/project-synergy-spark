/* Launches the Nitro server in production mode for Electron to connect to.
 *
 * Nitro builds with the "cloudflare-module" preset, where static assets are
 * served by the platform's `env.ASSETS` binding rather than by the handler.
 * Outside Cloudflare that binding does not exist, so this wrapper serves
 * `.output/public` from disk first and only then delegates to Nitro.
 */
const { createServer } = require("node:http");
const net = require("node:net");
const path = require("node:path");
const fs = require("node:fs");
const fsp = require("node:fs/promises");

const MIME_TYPES = {
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".map": "application/json; charset=utf-8",
};

function contentTypeFor(filePath) {
  return MIME_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream";
}

/**
 * Resolve a URL pathname to a file inside `publicDir`, or null when the path
 * escapes the directory or does not exist.
 */
function resolveStaticFile(publicDir, pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  if (decoded.includes("\0") || decoded.includes("..")) return null;

  const relative = decoded.replace(/^\/+/, "");
  if (!relative) return null;

  const root = path.resolve(publicDir);
  const target = path.resolve(root, relative);
  if (target !== root && !target.startsWith(root + path.sep)) return null;

  try {
    const stat = fs.statSync(target);
    if (!stat.isFile()) return null;
    return target;
  } catch {
    return null;
  }
}

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

/**
 * @param preferredPort port to bind, or 0/undefined to pick a free one
 * @param baseDir directory that contains `.output` (app bundle root)
 */
async function startNorthServer(preferredPort, baseDir) {
  const root = baseDir || process.cwd();
  const outputDir = path.join(root, ".output");
  const publicDir = path.join(outputDir, "public");
  const serverPath = path.join(outputDir, "server", "index.mjs");

  const serverModule = await import(`file://${serverPath}`);
  const handler = serverModule.default || serverModule;

  if (!handler || typeof handler.fetch !== "function") {
    throw new Error(`Nitro server entry not found in ${serverPath}`);
  }

  const port = preferredPort || (await findFreePort(3147));

  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, `http://localhost:${port}`);

      /* --- static layer: stands in for Cloudflare's env.ASSETS binding --- */
      if (req.method === "GET" || req.method === "HEAD") {
        const file = resolveStaticFile(publicDir, url.pathname);
        if (file) {
          const body = await fsp.readFile(file);
          res.writeHead(200, {
            "content-type": contentTypeFor(file),
            "content-length": body.length,
            "cache-control": "no-cache",
          });
          res.end(req.method === "HEAD" ? undefined : body);
          return;
        }
      }

      /* --- fall through to Nitro (SSR + server functions) --- */
      const headers = {};
      for (const [key, value] of Object.entries(req.headers)) {
        if (Array.isArray(value)) headers[key] = value.join(", ");
        else if (value) headers[key] = value;
      }
      const body = ["GET", "HEAD"].includes(req.method || "GET") ? undefined : await readBody(req);

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
      console.log(`North server running on http://127.0.0.1:${server.address().port}`);
      resolve(server.address().port);
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

module.exports = { startNorthServer, resolveStaticFile, contentTypeFor };
