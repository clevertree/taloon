import EmailServer from "../server/email/EmailServer";
import crypto from 'crypto';

const active2FactorLogins = {};

export default class UserClient {

    async handleLoginRequest(req, res) {
        const validations = {};
        console.log("Login: ", req.body);
        switch(req.body.service) {
            default:
            case 'email':
                await this.send2FactorEmail(req, req.body);
                break;
            case 'google':
                throw new Error("Not implemented");
        }

        // req.session.reset();
        // console.log('req.session.test', req.session.test);
        // req.session.test = 'wut';

        validations[''] = "Log in!";

        return validations;
    }

    static fromRequest(req) {
        return new UserClient();
    }

    async send2FactorEmail(req, values) {
        if(!values.email)
            throw new Error("Invalid email");
        const remoteAddress = req.headers['x-forwarded-for'] ||
            req.socket.remoteAddress ||
            null
        const email = values.email;
        const code2Factor = crypto.randomInt(1000,9999);
        active2FactorLogins[email] = code2Factor;
        values.code = code2Factor;
        values.session_details =
`Date: ${new Date().toLocaleString()}
Email: ${email}
IP Address: ${remoteAddress}
Browser: ${req.headers["user-agent"]}
Ref: ${req.headers.referrer}
`
        await EmailServer.sendMarkdownTemplateEmail(
            email,
            'Use this code to log in',
            `${process.env.REACT_APP_PATH_SITE}/user/login2factor.email.md`,
            values)
    }
}