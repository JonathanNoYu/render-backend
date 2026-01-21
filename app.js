import express from "express";
import "dotenv/config";
import webScarpeRoutes from "./webScrape/routes.js";
import open from 'open';

const app = express();

const allowedOrigins = process.env.FRONTEND_URL

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', true);
  return next();
});

webScarpeRoutes(app)
let port = process.env.PORT || 4000
app.listen(port);
open(`http://localhost:${port}/api/`)