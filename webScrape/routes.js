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
            postData = liveBrowsers[username][2]
            var {postData2, browser, page} = await webScrapePlaywright(`${BASE_URL_TUMBLR}/${username}`, 4, browser, page)
            postData = [...postData, ...postData2]
        } else {
            var {postData, browser, page} = await webScrapePlaywright(`${BASE_URL_TUMBLR}/${username}`)
        }
        
        liveBrowsers[username] = [browser, page, postData]
        await browser.close()
        res.json(postData);
    };

    app.get("/api/webScrape/tumblr/:tumblrUsername", webScrapeByTubmlrUser);
} export default webScarpeRoutes