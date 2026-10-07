#!/usr/bin/env node
// Zero-dependency static server for the demo site: node examples/demo-site/serve.mjs [port]
import fs from "node:fs";
import http from "node:http";
import path from "node:path";

const root = path.dirname(new URL(import.meta.url).pathname);
const port = Number(process.argv[2] ?? 4173);
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".png": "image/png", ".svg": "image/svg+xml" };

http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  let file = path.join(root, decodeURIComponent(url.pathname));
  if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
  if (!fs.existsSync(file) || path.basename(file) === "serve.mjs") { res.writeHead(404, { "content-type": "text/plain" }).end("Not found"); return; }
  res.writeHead(200, { "content-type": types[path.extname(file)] ?? "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
}).listen(port, () => console.log(`demo site: http://localhost:${port}`));
