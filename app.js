import express from "express";
import cors from "cors";
import session from "express-session";
import webScarpeRoutes from "./webScrape/routes.js";

const app = express();

app.use(
    cors({
        credentials: true,
        origin: process.env.FRONTEND_URL
    })
);
const sessionOptions = {
    secret: "any string",
    resave: false,
    saveUninitialized: false,
};
if (process.env.NODE_ENV !== "development") {
    sessionOptions.proxy = true;
    sessionOptions.cookie = {
        sameSite: "none",
        secure: true,
    };
}
app.use(session(sessionOptions));
webScarpeRoutes(app)
app.listen(process.env.PORT || 4000);