import webScrapePlaywright from "../scripts/playwrite.js";
import { readJson, writeJson } from "../scripts/fileUtil.js";
import { BASE_URL_TUMBLR } from "../constants.js";

const contentSoFar = {}
const scrollNum = 4
var firstScroll = 4
if (process.env.NODE_ENV && process.env.NODE_ENV === 'production') firstScroll = 2

function reportHtmlHeader(req, username) {
    console.log(`Request from: 
    User-agent: ${req.get("User-Agent")}
    Origin:     ${req.get("Origin")}
    Referer:    ${req.get("Referer")}
    WebScraping for user: ${username}`)
}

async function webScrape(username) {
    var postData, page;
    if (contentSoFar[username] && contentSoFar[username][1]) {
        const prevPage = contentSoFar[username][0]
        const prevData = contentSoFar[username][1]
        const prevheightInfo = contentSoFar[username][2]
        var {postData, page, heightInfo} = await webScrapePlaywright(`${BASE_URL_TUMBLR}/${username}`, scrollNum, prevData, prevPage, prevheightInfo)
        if (heightInfo[2] >= 3) {
            heightInfo = [0,0,0]
            page.close()
            page = undefined
        }
    } else {
        postData = readJson(username)
        var {postData, page, heightInfo} = await webScrapePlaywright(`${BASE_URL_TUMBLR}/${username}`, firstScroll, postData)
    }
    contentSoFar[username] = [page, postData, heightInfo]
    writeJson(username, postData)
    return contentSoFar
}

function webScarpeRoutes(app) {
    const webScrapeByTubmlrUser = async (req, res) => {
        const username = req.params.tumblrUsername
        reportHtmlHeader(req, username)
        await webScrape(username)
        res.json(contentSoFar[username][1]);
    };

    const webScrapTumblrSlim = async (req, res) => {
        const username = req.params.tumblrUsername
        reportHtmlHeader(req, username)
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
        writeJson(`${username}_slim`, data)
        res.json(data);
    }
    app.get("/api/webScrape/tumblr/:tumblrUsername", webScrapeByTubmlrUser);
    app.get("/api/:tumblrUsername", webScrapTumblrSlim);
} export default webScarpeRoutes