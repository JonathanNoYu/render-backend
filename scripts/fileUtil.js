import { RES_PATH } from '../constants.js';
import * as fs from 'node:fs';

function writeJson(pathAndfileName, content) {
    let fullPath = RES_PATH + pathAndfileName + '.json'
    try {
        fs.writeFileSync(fullPath, JSON.stringify(content, null, '\t'), 'utf8');
        console.log(`Wrote to ${fullPath}`);
    } catch (error) {
        console.log(`Error writing to ${fullPath}`, error);
    }
}

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
        return error
    }
    return undefined
}

export { readJson, writeJson }
