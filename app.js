import express from "express";
import cors from "cors";
import session from "express-session";
import "dotenv/config";
import webScarpeRoutes from "./webScrape/routes.js";

const app = express();

const allowedOrigins = process.env.FRONTEND_URL
console.log(allowedOrigins)
// const sessionOptions = {
//     secret: "any string",
//     resave: false,
//     saveUninitialized: false,
// };
// if (process.env.NODE_ENV !== "development") {
//     sessionOptions.proxy = true;
//     sessionOptions.cookie = {
//         sameSite: "none",
//         secure: true,
//         store: new MemoryStore({
//             checkPeriod: 360000 // prune expired entries every 10 mins
//         }),
//     };
// }
// app.use(session(sessionOptions));

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
       res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', true);
  return next();
});

webScarpeRoutes(app)
app.listen(process.env.PORT || 4000);