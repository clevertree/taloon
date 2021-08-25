import {promises as fsp} from "fs";
import path from "path";
import EnvironmentUtil from "./EnvironmentUtil";

export default class ContentUtil {
    static async fetchDefaultConfig() { return await this.fetchJSONFile(process.env.REACT_APP_PATH_CONTENT_CONFIG)}
    static async fetchJSONFile(contentFilePath) {
        const content = await this.fetchTextFile(contentFilePath);
        return JSON.parse(content);
    }

    static async fetchTextFile(contentFilePath) {
        if(EnvironmentUtil.isNode()) {
            const filePath = path.join(process.env.REACT_APP_PATH_CONTENT, contentFilePath)+'';
            return await fsp.readFile(filePath, 'utf8');
        } else {
            const configURL = new URL(contentFilePath, process.env.REACT_APP_API_ENDPOINT)+'';
            const res = await fetch(configURL);
            return await res.text();
        // } else {
        //     throw new Error("Invalid environment");
        }
    }
}


