import { BASE_URL_TUMBLR } from "../constants.js";
import { chromium } from "playwright";
import * as cheerio from 'cheerio';

async function webScrapePlaywright(url, scrollMax=4, prevData, browser, page) {
    var context;
    if (browser === undefined) {
        browser = await chromium.launch({ headless: true });
        context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        viewport: { width: 1366, height: 768 }
    })
    }
    if (page === undefined) {
        page = await context.newPage();
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
        await page.goto(url, { waitUntil: 'domcontentloaded' });
    }
    // await page.waitForSelector('.FtjPK');
    var html = await page.content()
    var postData = prevData
    if (prevData === undefined) {
        var postData = processTrumblrPage(html)
    }
    var scrollcount = 0;
    while(scrollcount < scrollMax) {
        await page.keyboard.press('End')
        await page.waitForTimeout(175)
        await page.keyboard.press('End')
        await page.waitForTimeout(175)
        await page.keyboard.press('End')
        await page.waitForTimeout(175)
        await page.keyboard.press('End')
        await page.waitForTimeout(175)
        html = await page.content()
        await page.waitForTimeout(175)
        var data = processTrumblrPage(html)
        postData = [...postData, ...data]
        scrollcount++
        console.log(`Scrolling on ${url} scollcount:${scrollcount}`)
    }
    // const fs = require('node:fs');
    //fs.writeFile('postDataBefore2.txt', JSON.stringify(postData), err => {if (err) console.error(err)})
    console.log("postData length before consolidating:" + postData.length)
    postData = consolidateOrRemove(postData)
    //fs.writeFile('postDataAfter2.txt', JSON.stringify(postData), err => {if (err) console.error(err)})
    console.log("postData length after consolidating:" + postData.length)
    return {postData, browser, page}
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
                    resObj["body"] = [...resObj["body"], ...obj["body"]]
                    resObj["users"] = [...resObj["users"], ...obj["users"]]
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

function processTrumblrPage(html) {
    const $ = cheerio.load(html);
    const dates = []
    const allPosts = []
    const allPostsOnPage = $('article.FtjPK'); // article.FtjPK r0etU
    // Check p.F2bKK to check if a post is pinned. If it is ignore it.
    const pinned = allPostsOnPage.find(".F2bKK").length
    allPostsOnPage.each((_i, el) => {
        if (_i > pinned) { 
            const post = $(el).find(".Qb2zX") // all users + posts
            const lastActivityOnPost = $(el).find('.l4Qpd').attr('aria-label') // Usually Reblog
            // const tags = $(el).find("div.mwjNz") // tags
            post.each((__i, el) => {
                var author = "";
                var id;
                const users = []
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
                allPosts.push({id:id, title:titleInfo[0], subtitle: titleInfo[1], author:author, 
                                dates:postDates, links:postLinks, users:users, body:postBody})
            })
        }
    })
    return allPosts
}
export default webScrapePlaywright
const bruno = 'https://www.tumblr.com/stormofembla'

