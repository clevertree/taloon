import EmailServer from "../server/email/EmailServer";
import crypto from 'crypto';

const active2FactorLogins = {};

export default class UserClient {

    async handleLoginRequest(req, res, form) {
        switch(req.body.service) {
            case 'email':
                await this.handleSend2FactorEmailRequest(req, res);
                break;

            case 'email-2factor-response':
                await this.handle2FactorLoginRequest(req, res);
                break;
            default:
            case 'google':
                throw new Error("Not implemented: " + req.body.service);
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

    async handleSend2FactorEmailRequest(req, res) {
        await this.send2FactorEmail(req);
        res.send({
            message: "A 2-Factor code sent to your email address. Please use it to log in"
        })
    }

    async send2FactorEmail(req) {
        const values = Object.assign({}, req.body);
        if(!values.email)
            throw new Error("Invalid email");
        const email = values.email;
        const code2Factor = crypto.randomInt(1000,9999);

        values.remoteAddress = req.headers['x-forwarded-for'] ||
            req.socket.remoteAddress ||
            null;
        values.host = process.env.REACT_APP_PATH_PUBLIC || req.headers.origin;
        values.codeUrl = new URL(
            `${process.env.REACT_APP_PATH_SITE}/user/login2factor.md?email=${email}&code=${code2Factor}`,
            values.host);
        values.loginUrl = new URL(
            `${process.env.REACT_APP_PATH_SITE}/user/login.md?email=${email}`,
            values.host);

        // Add 2 Factor
        active2FactorLogins[email] = code2Factor;
        setTimeout(() => delete active2FactorLogins[email], process.env.REACT_APP_2FACTOR_TIMEOUT);

        values.code = code2Factor;
        values.sessionDetails =
`Date: ${new Date().toLocaleString()}
Email: ${values.email}
IP Address: ${values.remoteAddress || 'N/A'}
Browser: ${req.headers["user-agent"] || 'N/A'}
Ref: ${req.headers.referrer || 'N/A'}
`

        await EmailServer.sendMarkdownTemplateEmail(
            email,
            'Use this code to log in',
            `${process.env.REACT_APP_PATH_SITE}/user/login2factor.email.md`,
            values)

    }


    async handle2FactorLoginRequest(req, res) {
        await this.loginWith2Factor(req);
        res.send({
            message: "You are now logged in"
        });
        // TODO: redirect
    }

    async loginWith2Factor(req) {
        const code2Factor = Number.parseInt(req.body.code);
        const email = req.body.email;
        if(active2FactorLogins[email] !== code2Factor)
            throw new Error("Invalid 2-Factor Code");

        // req.session.reset();
        // Reset session
        req.session = {
            email
        };
        console.log('req.session', req.session);
        // req.session.test = 'wut';
    }
}