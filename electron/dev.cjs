/* Runs the Vite dev server and Electron together for `npm run electron:dev`.
 * Keeps the dev flow dependency-free (no concurrently/wait-on). */
const { spawn } = require("node:child_process");
const http = require("node:http");

const PORT = process.env.NORTH_DEV_PORT || "3000";
const DEV_URL = `http://localhost:${PORT}`;

const vite = spawn("npx", ["vite", "dev", "--port", PORT], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

let electron = null;

function shutdown(code) {
  if (electron && !electron.killed) electron.kill();
  if (vite && !vite.killed) vite.kill();
  process.exit(code ?? 0);
}

function ping(attempt = 0) {
  const req = http.get(DEV_URL, (res) => {
    res.resume();
    start();
  });
  req.on("error", () => {
    if (attempt > 60) {
      console.error(`Vite dev server did not come up at ${DEV_URL}`);
      shutdown(1);
      return;
    }
    setTimeout(() => ping(attempt + 1), 500);
  });
}

function start() {
  electron = spawn("npx", ["electron", "electron/main.cjs"], {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: { ...process.env, NORTH_DEV_URL: DEV_URL },
  });
  electron.on("exit", (code) => shutdown(code ?? 0));
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
vite.on("exit", (code) => shutdown(code ?? 0));

ping();
