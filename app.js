import express from "express";
import cors from "cors";
import session from "express-session";
import "dotenv/config";
import webScarpeRoutes from "./webScrape/routes.js";

const app = express();

const allowedOrigins = process.env.FRONTEND_URL
console.log(allowedOrigins)
app.use(
    cors({
        credentials: true,
        origin: (origin, callback) => {
            if (!origin) return callback(null, true);

            if (allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error("Not allowed by CORS"));
            }
        },
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