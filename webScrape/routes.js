    import webScrapePlaywright from "../scripts/playwrite.js";
import { BASE_URL_TUMBLR } from "../constants.js";

function webScarpeRoutes(app) {
    const liveBrowsers = {}
    const webScrapeByTubmlrUser = async (req, res) => {
        const username = req.params.tumblrUsername
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
        await browser.close()
        res.json(postData);
    };

    app.get("/api/webScrape/tumblr/:tumblrUsername", webScrapeByTubmlrUser);
} export default webScarpeRoutes