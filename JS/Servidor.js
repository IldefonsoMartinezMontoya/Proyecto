const express = require("express");
const fs = require("node:fs");
const CARPETA_VIDEOS = process.env.CARPETA_VIDEOS || "/media/trabajo/86CC-14A4/Peliculas";
const app = express();

if (!fs.existsSync(CARPETA_VIDEOS)) {
  throw new Error(`No existe la carpeta de vídeos: ${CARPETA_VIDEOS}`);
}

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Range");
  res.setHeader("Access-Control-Expose-Headers", "Content-Length, Content-Range, Accept-Ranges");

  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.use("/videos", express.static(CARPETA_VIDEOS, { acceptRanges: true }));

app.listen(3000, "127.0.0.1", () => {
  console.log("Servidor de vídeos escuchando en http://127.0.0.1:3000");
  console.log(`Carpeta de vídeos: ${CARPETA_VIDEOS}`);
});
