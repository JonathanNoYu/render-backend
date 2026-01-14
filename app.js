import express from "express";
import cors from "cors";
import session from "express-session";
import "dotenv/config";
import webScarpeRoutes from "./webScrape/routes.js";

const app = express();

const allowedOrigins = process.env.FRONTEND_URL
const webSite = allowedOrigins.substring(2, 32)
console.log(webSite)
app.use(
    cors({
        credentials: true,
        origin: webSite,
        methods: ["GET"]
    })
);
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
webScarpeRoutes(app)
app.listen(process.env.PORT || 4000);