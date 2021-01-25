import express from "express";

express()
  .use("/gallia", express.static("out"))
  .use("/", express.static("examples"))
  .listen(8080);
