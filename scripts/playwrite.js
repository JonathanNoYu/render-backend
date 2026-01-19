import { BASE_URL_TUMBLR } from "../constants.js";
import { chromium } from "playwright";
import * as cheerio from 'cheerio';

async function webScrapePlaywright(url, scrollMax=4, prevData, page) {
    if (page === undefined) {
        const browser = await chromium.launch({ headless: true });
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            viewport: { width: 1366, height: 768 }
        })
        page = await context.newPage();
        page.on('close', data => {
            browser.close()
        });
        await page.addStyleTag({ content: `html { scroll-behavior: initial !important; } 
                                        *,
                                        *::before,
                                        *::after {
                                        transition: none !important;
                                        animation: none !important;
                                        }`});
        // Intercept all requests
        await page.route('**/*', (route) => {
            const type = route.request().resourceType();
            // Block heavy, non-essential assets
            if (type === 'image' || type === 'font' || type === 'media') {
                return route.abort();
            }
            // Allow everything else (HTML, JS, XHR, fetch, etc.)
            return route.continue();
            });
        console.log("Going to website " + url)
        await page.goto(url, { waitUntil: 'domcontentloaded' });
    }
    var html = await page.content()
    var postData = prevData
    if (prevData === undefined) {
        var postData = processTrumblrPage(html)
    }
    var scrollcount = 0;
    while(scrollcount < scrollMax) {
        await scrollABit(page)
        await scrollABit(page)
        await scrollABit(page)
        await scrollABit(page)
        html = await page.content()
        var data = processTrumblrPage(html)
        postData = [...postData, ...data]
        scrollcount++
        console.log(`Scrolling on ${url} scollcount:${scrollcount}`)
    }
    // const fs = require('node:fs');
    // fs.writeFile('postDataBefore2.txt', JSON.stringify(postData), err => {if (err) console.error(err)})
    console.log("postData length before consolidating:" + postData.length)
    postData = consolidateOrRemove(postData)
    // fs.writeFile('postDataAfter2.txt', JSON.stringify(postData), err => {if (err) console.error(err)})
    console.log("postData length after consolidating:" + postData.length)
    return {postData, page}
}

async function scrollABit(page) {
    if (process.env.NODE_ENV && process.env.NODE_ENV === "production") {
        await page.keyboard.press('End')
    } else {
        await page.keyboard.press('End')
        await page.waitForTimeout(175)
    }
}

function consolidateOrRemove(arrOfObj) {
    const resArr = []
    for (const obj of arrOfObj) {
        var notInArr = true
        // Check Array
        for (const resObj of resArr) {
            if (resObj["title"] === obj["title"]) {
                // Check if a duplicate of this is not already in the loop add
                if(!resObj["dates"].includes(obj["dates"][1])) {
                    resObj["links"] = [...resObj["links"], ...obj["links"].slice(1)]
                    resObj["dates"] = [...resObj["dates"], ...obj["dates"].slice(1)]
                    resObj["bodys"] = [...resObj["bodys"], ...obj["bodys"]]
                    resObj["users"] = [...resObj["users"], ...obj["users"]]

                    const objWC = obj["wordcount"]
                    const resWC = resObj["wordcount"]
                    for (const user of Object.keys(objWC)) {
                        resWC[user] = resWC[user] + objWC[user] | objWC[user]
                    }
                }
                notInArr = false;
            }
        }
        if (notInArr) {
            resArr.push(obj)
        }
    }
    return resArr
}

// Adding this so backend show the wordcount but only if ran not in prod.
// So the free tier render does not use more ram than it needs to.
function addWordCount(postData) {
    postData = postData.map((post, _i) => {
        const postBody = post["bodys"]
        const users = post["users"] 
        const newUsers = post["wordcount"]
        if (postBody.length < users.length) return post;
        users.map((u, _i) =>{
            newUsers[u] = newUsers[u] + postBody[_i].length | postBody[_i].length
        })
        return post
    })
    return postData
}

function processTrumblrPage(html) {
    const $ = cheerio.load(html);
    var allPosts = []
    const allPostsOnPage = $('article.FtjPK'); // article.FtjPK r0etU
    // Check p.F2bKK to check if a post is pinned. If it is ignore it.
    const pinned = allPostsOnPage.find(".F2bKK").length
    allPostsOnPage.each((_i, el) => {
        if (_i > pinned) { 
            const post = $(el).find(".Qb2zX") // all users + posts
            // const tags = $(el).find("div.mwjNz") // tags
            post.each((__i, el) => {
                var author = "";
                var id;
                var users = []
                const postBody = []
                const postDates = []
                const postLinks = []
                const dates = $(el).find('.l4Qpd')
                const usersInPost = $(el).find(".BSUG4")  
                const posts = $(el).find(".GzjsW")
                const links = $(el).find(".gg65T")    
                const titleInfo = [] // [title, subtitle]
                usersInPost.each((___i, userEl) => { // username
                    const userString = $(userEl).text();
                    if (___i === 0) { 
                        author = userString 
                    } else if (userString !== "" && !userString.includes('@')) {
                        users.push(userString)
                    } 
                })
                posts.each((___i, postEl) => { // post content
                    if (___i === 0) { // includes title and subtitles 
                        $(postEl).find(".k31gt").each((___i, titleEl) => {
                            titleInfo.push($(titleEl).text())          // Gets title then sub-title
                        })
                    } else {
                        postBody.push($(postEl).text())
                    }
                })
                dates.each((___i, datesEl) => { // posted Dates
                    postDates.push($(datesEl).attr('aria-label'))
                })
                links.each((___i, linksEl) => { // links for each post
                    postLinks.push(BASE_URL_TUMBLR + $(linksEl).attr('href'))
                })
                if (author === "" && users.length > 0) author = users.shift()
                if (postLinks && postLinks.length > 0) id = postLinks[0].replace(/\D/g, "")
                allPosts.push({id:id, title:titleInfo[0], wordcount:{}, subtitle: titleInfo[1], author:author, 
                                dates:postDates, links:postLinks, users:users, bodys:postBody})
            })
        }
    })
    if (!process.env.NODE_ENV || process.env.NODE_ENV !== 'production') {
        allPosts = addWordCount(allPosts)
    }
    return allPosts
}
export default webScrapePlaywright
const bruno = 'https://www.tumblr.com/stormofembla'

