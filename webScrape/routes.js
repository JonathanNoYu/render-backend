import webScrapePlaywright from "../scripts/playwrite.js";
import { BASE_URL_TUMBLR } from "../constants.js";

function webScarpeRoutes(app) {
    const contentSoFar = {}
    var scrollNum = 4
    var firstScroll = 4
    if (process.env.NODE_ENV || process.env.NODE_ENV === 'production') firstScroll = 2
    const webScrapeByTubmlrUser = async (req, res) => {
        const username = req.params.tumblrUsername
        console.log(`Request from: 
    User-agent: ${req.get("User-Agent")}
    Origin:     ${req.get("Origin")}
    Referer:    ${req.get("Referer")}
    WebScraping for user: ${username}`)
        var postData, page;
        if (contentSoFar[username]) {
            const prevPage = contentSoFar[username][0]
            const prevData = contentSoFar[username][1]
            var {postData, page} = await webScrapePlaywright(`${BASE_URL_TUMBLR}/${username}`, scrollNum, prevData, prevPage)
        } else {
            var {postData, page} = await webScrapePlaywright(`${BASE_URL_TUMBLR}/${username}`, firstScroll)
        }
        contentSoFar[username] = [page, postData]
        res.json(postData);
    };

    app.get("/api/webScrape/tumblr/:tumblrUsername", webScrapeByTubmlrUser);
} export default webScarpeRoutes