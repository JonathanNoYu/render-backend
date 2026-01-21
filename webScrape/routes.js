import webScrapePlaywright from "../scripts/playwrite.js";
import { BASE_URL_TUMBLR } from "../constants.js";

const contentSoFar = {}
const scrollNum = 4
var firstScroll = 4
if (process.env.NODE_ENV && process.env.NODE_ENV === 'production') firstScroll = 2

async function webScrape(username) {
    var postData, page;
    if (contentSoFar[username]) {
        const prevPage = contentSoFar[username][0]
        const prevData = contentSoFar[username][1]
        const prevheightInfo = contentSoFar[username][1]
        var {postData, page, heightInfo} = await webScrapePlaywright(`${BASE_URL_TUMBLR}/${username}`, scrollNum, prevData, prevPage, prevheightInfo)
    } else {
        var {postData, page, heightInfo} = await webScrapePlaywright(`${BASE_URL_TUMBLR}/${username}`, firstScroll)
        if (heightInfo[2] >= 3) {
            heightInfo = [0,0,0]
            page.close()
            page = undefined
        }
    }
    contentSoFar[username] = [page, postData, heightInfo]
    return contentSoFar
}

function webScarpeRoutes(app) {
    const webScrapeByTubmlrUser = async (req, res) => {
    const username = req.params.tumblrUsername
    console.log(`Request from: 
    User-agent: ${req.get("User-Agent")}
    Origin:     ${req.get("Origin")}
    Referer:    ${req.get("Referer")}
    WebScraping for user: ${username}`)
        await webScrape(username)
        res.json(contentSoFar[username][1]);
    };

    const webScrapTumblrSlim = async (req, res) => {
        const username = req.params.tumblrUsername
        await webScrape(username)
        let postData = contentSoFar[username][1]
        let data = []
        for (let post of postData) {
            let slimPost = {}
            let propList = ["title", "author","wordcount"]
            for (let prop of propList) {
                slimPost[prop] = post[prop]
            }
            slimPost[username + "-post-count"] = post["users"].filter(user => user === username).length
            if (Object.hasOwn(slimPost["wordcount"], username)){
                data.push(slimPost)
            }
        }
        res.json(data);
    }
    app.get("/api/webScrape/tumblr/:tumblrUsername", webScrapeByTubmlrUser);
    app.get("/api/:tumblrUsername", webScrapTumblrSlim);
} export default webScarpeRoutes