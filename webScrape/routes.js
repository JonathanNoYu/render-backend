    import webScrapePlaywright from "../scripts/playwrite.js";
import { BASE_URL_TUMBLR } from "../constants.js";

function webScarpeRoutes(app) {
    const liveBrowsers = {}
    const webScrapeByTubmlrUser = async (req, res) => {
        const username = req.params.tumblrUsername
        console.log(`Request from: 
    User-agent: ${req.get("User-Agent")}
    Origin:     ${req.get("Origin")}
    Referer:    ${req.get("Referer")}`)
        var postData, browser, page;
        console.log(`WebScraping for user: ${username}`)
        if (liveBrowsers[username]) {
            const prevBrowser = liveBrowsers[username][0]
            const prevPage = liveBrowsers[username][1]
            var {postData, browser, page} = await webScrapePlaywright(`${BASE_URL_TUMBLR}/${username}`, 4, liveBrowsers[username][2], prevBrowser, prevPage)
        } else {
            var {postData, browser, page} = await webScrapePlaywright(`${BASE_URL_TUMBLR}/${username}`)
        }
        liveBrowsers[username] = [browser, page, postData]
        res.json(postData);
    };

    setInterval(() => {
        for (const key of Object.keys(liveBrowsers)) {
            delete liveBrowsers[key]
        }
    }, 600000) // 10 mins timer to clear the obj

    app.get("/api/webScrape/tumblr/:tumblrUsername", webScrapeByTubmlrUser);
} export default webScarpeRoutes