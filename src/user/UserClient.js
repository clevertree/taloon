import EmailServer from "../server/email/EmailServer";
import path from "path";
import fs from "fs";
import {JSDOM} from "jsdom";

export default class UserClient {

    async handleLoginRequest(req) {
        const validations = {};
        const values = req.body;
        console.log("Login: ", values);

        const pathMD = path.resolve(process.env.REACT_APP_PATH_CONTENT,
            process.env.REACT_APP_PATH_SITE, './user/login.email.md');
        if (!fs.existsSync(pathMD))
            throw new Error("Email template not found: " + pathMD);

        const markdownContent = fs.readFileSync(pathMD, 'utf8');
        await EmailServer.sendMarkdownEmail('ari.asulin@gmail.com', 'test TEST', markdownContent)
        // req.session.reset();
        // console.log('req.session.test', req.session.test);
        // req.session.test = 'wut';

        validations[''] = "Log in!";

        return validations;
    }

    static fromRequest(req) {
        return new UserClient();
    }
}