import webScrapePlaywright from "../scripts/playwrite.js";
import { BASE_URL_TUMBLR } from "../constants.js";

function webScarpeRoutes(app) {
    const liveBrowsers = {}
    const webScrapeByTubmlrUser = async (req, res) => {
        const username = req.params.tumblrUsername
        var postData, browser, page;
        if (liveBrowsers[username]) {
            var {postData, browser, page} = await webScrapePlaywright(`${BASE_URL_TUMBLR}/${username}`, 4, browser, page)
        } else {
            var {postData, browser, page} = await webScrapePlaywright(`${BASE_URL_TUMBLR}/${username}`)
        }
        
        liveBrowsers[username] = browser
        await browser.close()
        res.json(postData);
    };

    app.get("/api/webScrape/tumblr/:tumblrUsername", webScrapeByTubmlrUser);
} export default webScarpeRoutes