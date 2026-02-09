import { BASE_URL_TUMBLR } from "../constants.js";
import { chromium } from "playwright";
import * as cheerio from 'cheerio';
import { PAGE_KEYPRESS_TIMEOUT } from "../constants.js";
import { weekdayToDate, checkYearOrAddYear } from "./dataeUtils.js";

/**
 * Given a min and max number returns a random integer inclusive of the min and max numbers.
 * 
 * @param {Number} min 
 * @param {Number} max 
 * @returns Number between min and max (inclusive)
 */
function randomIntFromInterval(min, max) { // min and max included 
  return Math.floor(Math.random() * (max - min + 1) + min);
}

/**
 * Sorts an Array of objects by the "dates" property. Assumes the order should be chronological with the most recent 
 * object/post being the first in the array.
 * 
 * @param {Array<Object>} postData 
 * @returns Array<Object> sorted version of the given array of objects using "dates" property.
 */
function sortPostData(postData) {
    return postData.sort((a, b) => {
        let aDates = a["dates"]
        let bDates = b["dates"]
        let maxFromA = aDates.sort()[aDates.length - 1]
        let maxFromB = bDates.sort()[bDates.length - 1]
        if (maxFromA && maxFromB) { 
            let num = maxFromA.toString().localeCompare(maxFromB.toString())
            return num * -1
        }
        if (maxFromA) return -1
        if (maxFromB) return 1
        return 0
    })
}

/**
 * Given a string url createse a playwright headless browser and returns a page at that url.
 * 
 * @param {String} url - string version of a url to get the playwright page of.
 * @returns Playwright page object. 
 */
async function createPage(url) {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        viewport: { width: randomIntFromInterval(1366, 1920), height: randomIntFromInterval(768, 1080)}
    })
    var page = await context.newPage();
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
    return page
}

/**
 * Given a url returns an array of objects of tumblr posts, playwright page of the website and an array of height info 
 * about current page height, number of same height when scrolled (resets to zero on reload) and number of reloads to the page 
 * (reloads when # of same height when scrolled is >= 2)
 * 
 * @param {String} url 
 * @param {Number} scrollMax 
 * @param {Array<Object>} prevData 
 * @param {Playwright page} page 
 * @param {Array<Number>[3]} heightInfo 
 * @returns {Array<Object>, Playwright page, Array<Number>[3]} {postData, page, heightInfo} 
 */
async function webScrapePlaywright(url, scrollMax=4, prevData, page, heightInfo) {
    if (!page || heightInfo[2] >= 3) {
        page = await createPage(url)
        heightInfo = [0,0,0]
    }
    var html
    try {
        html = await page.content()
    } catch (err) {
        page = await createPage(url)
        html = await page.content()   
    }
    var postData = removeWordCount(prevData)
    if (!prevData) postData = processTumblrPage(html)
    postData = postData
    var scrollcount = 0;
    // [initalHeight, # of init>=newHeight, # of reloads]
    if (!heightInfo) heightInfo = [0, 0, 0];
    while(scrollcount < scrollMax) {
        await scrollABit(page)
        await scrollABit(page)
        heightInfo = await reloadAtBottom(page, heightInfo)
        await scrollABit(page)
        heightInfo = await reloadAtBottom(page, heightInfo)
        await scrollABit(page)
        heightInfo = await reloadAtBottom(page, heightInfo)
        await scrollABit(page)
        heightInfo = await reloadAtBottom(page, heightInfo)
        html = await page.content()
        var data = processTumblrPage(html)
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
    if (!process.env.NODE_ENV || process.env.NODE_ENV !== 'production') {
        postData = addWordCount(postData)
    }
    return {postData, page, heightInfo}
}

/**
 * Given a Playwright page and an array of height info it will reload the page or update the current height (heightInfo[0])
 * Will increment heightInfo[1] if current hieght and past height are the same
 * Will increment heightInfo[2] if heightInfo[1] >= 2, reloads the page and sets heightInfo[0] to 0
 * Console logs the inital, after and set heights also logs if the page reloads.
 *  
 * @param {Playwright page} page 
 * @param {Array<Numbers>[3]} heightInfo 
 * @returns Array<Numbers>[3] updated heightInfo.
 */
async function reloadAtBottom(page, heightInfo) {
    let newWinH = await page.evaluate(() => document.getElementById("root").offsetHeight);
    await page.waitForTimeout(PAGE_KEYPRESS_TIMEOUT)
    console.log(`init  scroll height: ${heightInfo[0]}`)
    console.log(`after scroll height: ${newWinH}`)
    if (heightInfo[0] >= newWinH) {
        heightInfo[1] += 1
        await page.waitForTimeout(PAGE_KEYPRESS_TIMEOUT)
    } 
    if (heightInfo[1] >= 2) {
        console.log(`reload page`)
        await page.reload()
        await page.waitForTimeout(PAGE_KEYPRESS_TIMEOUT)
        heightInfo[1] = 0
        heightInfo[2] += 1
        newWinH = 0
    }
    heightInfo[0] = newWinH
    console.log(`set initHeight:      ${heightInfo[0]}`)
    console.log(`____________________________________________________`)
    return heightInfo
}

/**
 * Given a Playwright page scrolls by using the "End" keyboard press
 * 
 * @param {Playwright page} page 
 */
async function scrollABit(page) {
    if (process.env.NODE_ENV && process.env.NODE_ENV === "production") {
        await page.keyboard.press('End')
    } else {
        await page.keyboard.press('End')
        await page.waitForTimeout(PAGE_KEYPRESS_TIMEOUT)
    }
}

/**
 * Given an Array of Objects (assuming postData from processTumblrPage(html)) consolidates or removes duplicates of the same object
 * based on the title property of each object. Will return a sorted version of the consolidated Array
 * 
 * @param {Array<Object>} arrOfObj 
 * @returns Array<Object> - each object is unique and has the combined data of any post with the same title.
 */
function consolidateOrRemove(arrOfObj) {
    var resArr = []
    for (const obj of arrOfObj) {
        var notInArr = true
        // Check Array
        for (const resObj of resArr) {
            if (resObj["title"] === obj["title"]) {
                // Check if a duplicate of this is not already in the loop add
                if(!resObj["postInfo"].includes(obj["postInfo"][1])) {
                    resObj["links"] = [...resObj["links"], ...obj["links"].slice(1)]
                    resObj["dates"] = [...resObj["dates"], ...obj["dates"].slice(1)]
                    resObj["postInfo"] = [...resObj["postInfo"], ...obj["postInfo"].slice(1)]
                    resObj["bodys"] = [...resObj["bodys"], ...obj["bodys"]]
                    resObj["users"] = [...resObj["users"], ...obj["users"]]
                }
                notInArr = false;
            }
        }
        if (notInArr) {
            resArr.push(obj)
        }
    }
    return sortPostData(resArr)
}

/**
 * Removes the property "wordcount" from an array of objects
 * 
 * @param {Array<Object>} postData 
 * @returns Array<Object> postData without the property "wordcount"
 */
function removeWordCount(postData) {
    if (postData) {
        postData = postData.map((post, _i) => {
        const wc = post["wordcount"]
        for (let keys of Object.keys(wc)) {
            wc[keys] = 0; 
        }
        return post
    })
    }
    return postData
}

/**
 * Adding this so backend show the wordcount but only if ran not in prod.
 * So the free tier render does not use more ram than it needs to.
 * 
 * @param {Array<Object>} postData - array of objects that includes all the post data from a tumblr post (from processTumlbrPage)
 * @returns Array<Object> postData with word count and userCount (# of reposts from each user) added as an property postData["wordcount"] & postData["userCount"] 
 */
function addWordCount(postData) {
    postData = postData.map((post, _i) => {
        const postBody = post["bodys"]
        const users = post["users"] 
        const newUsers = post["wordcount"]
        if (postBody.length < users.length) return post;
        users.map((u, __i) =>{
            let bodyCount = postBody[__i].split(" ").filter(word => word !== "").length
            newUsers[u] = newUsers[u] ? newUsers[u] + bodyCount : bodyCount
        })
        post["userCount"] = users.length
        return post
    })
    return postData
}

/**
 * Processes a tumblr page based on The Officer Academy FE rp group. Takes in a string of html to process
 * 
 * @param {String} html - html from a tumblr page i.e. https://www.tumblr.com/<username here>
 * @returns Array<Object> - an Array of posts with each entry being an object with properties include
 *  id, title, wordcount, subtitle, author, postInfo, dates, links, users, body (as of 2/9/2026)
 */
function processTumblrPage(html) {
    const $ = cheerio.load(html);
    var allPosts = []
    const allPostsOnPage = $('article.FtjPK'); // article.FtjPK r0etU
    // Check p.F2bKK to check if a post is pinned. If it is ignore it.
    const pinned = allPostsOnPage.find(".F2bKK").length
    allPostsOnPage.each((_i, el) => {
        if (_i >= pinned) { 
            const post = $(el).find(".Qb2zX") // all users + posts
            // const tags = $(el).find("div.mwjNz") // tags
            post.each((__i, el) => {
                var author = "";
                var id;
                var users = []
                const postBody = []
                const postDates = []
                const jsDates = []
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
                    var dateInfo = $(datesEl).attr('aria-label')
                    let removedOrdinals = dateInfo.replace(/(\d+)(?:st|nd|rd|th)\b/, "$1")
                    var date = new Date(Date.parse(removedOrdinals))
                    if (isNaN(date)) {
                        var [date, dateInfo] = weekdayToDate(removedOrdinals)
                    }
                    if (!dateInfo.match(/\b\d{4}\b/)) {
                        var [date, dateInfo] = checkYearOrAddYear(date, removedOrdinals)
                    }
                    postDates.push(dateInfo)
                    jsDates.push(date)
                })
                links.each((___i, linksEl) => { // links for each post
                    postLinks.push(BASE_URL_TUMBLR + $(linksEl).attr('href'))
                })
                if (author === "" && users.length > 0) author = users.shift()
                if (postLinks && postLinks.length > 0) id = postLinks[0].replace(/\D/g, "")
                allPosts.push({id:id, title:titleInfo[0], wordcount:{}, subtitle: titleInfo[1], author:author, 
                                postInfo:postDates, dates:jsDates, links:postLinks, users:users, bodys:postBody})
            })
        }
    })
    return allPosts
}
export default webScrapePlaywright

