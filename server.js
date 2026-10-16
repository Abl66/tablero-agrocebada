const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const html = fs.readFileSync(path.join(__dirname, "index.html"));

http.createServer((req, res) => {
  if (req.url === "/health") { res.writeHead(200); return res.end("ok"); }
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=300" });
  res.end(html);
}).listen(PORT, "0.0.0.0", () => console.log(`Tablero AgroCebada en el puerto ${PORT}`));
