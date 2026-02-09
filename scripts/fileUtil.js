import { RES_PATH } from '../constants.js';
import * as fs from 'node:fs';

/**
 * Wrties the JSON string of content to the RES_PATH/<pathAndFileName>.json
 * Will pad/tab the JSON content in the file for easier reading
 * 
 * @param {*} pathAndfileName - path and filename we want to give the file
 * @param {*} content - javascript data that we want to put in the file as json
 */
function writeJson(pathAndfileName, content) {
    let fullPath = RES_PATH + pathAndfileName + '.json'
    try {
        if (!fs.existsSync(RES_PATH)){
            fs.mkdirSync(RES_PATH);
        }
        fs.writeFileSync(fullPath, JSON.stringify(content, null, '\t'), 'utf8');
        console.log(`Wrote to ${fullPath}`);
    } catch (error) {
        console.log(`Error writing to ${fullPath}`, error);
    }
}

/**
 * Given a pathAndFileName adds the RES_PATH and .json attribute and tries to read a file.
 * If the file exists returns and parses the JSON in the file
 * 
 * @param {String} pathAndfileName 
 * @returns Object - returns the JSON in the file at RES_PATH/<pathAndfileName>.json
 */
function readJson(pathAndfileName) {
    let fullPath = RES_PATH + pathAndfileName + '.json'
    try {
        if (fs.existsSync(fullPath)) {
            let data = fs.readFileSync(fullPath); 
            console.log(`Read file ${fullPath}`)
            return JSON.parse(data)
        }
    } catch (error) {
        console.log(`An error in reading ${fullPath}`, error)
    }
    return undefined
}

export { readJson, writeJson }
