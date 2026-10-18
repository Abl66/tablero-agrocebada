const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};
const PUBLIC = new Set(["index.html", "css", "js"]); // solo se sirve lo que está aquí

http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split("?")[0]);
  if (url === "/health") { res.writeHead(200); return res.end("ok"); }

  const rel = url === "/" ? "index.html" : path.normalize(url).replace(/^[/\\]+/, "");
  const file = path.join(ROOT, rel);
  if (!file.startsWith(ROOT) || !PUBLIC.has(rel.split(/[/\\]/)[0])) {
    res.writeHead(404); return res.end("No encontrado");
  }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404); return res.end("No encontrado"); }
    res.writeHead(200, {
      "Content-Type": TYPES[path.extname(file)] || "application/octet-stream",
      "Cache-Control": "public, max-age=300",
    });
    res.end(buf);
  });
}).listen(PORT, "0.0.0.0", () => console.log(`Tablero AgroCebada en el puerto ${PORT}`));
