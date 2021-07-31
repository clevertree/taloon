import EmailServer from "../server/email/EmailServer";
import crypto from 'crypto';

const active2FactorLogins = {};

export default class UserSession {
    constructor(session={}) {
        this.session = session;
    }

    login(req, email) {
        console.log('Logging In ', email);
        req.session = {
            email,
        };
        this.session = req.session;
    }

    logout(req) {
        this.session = req.session = null;
    }

    handleLogOutRequest(req, res) {
        this.logout(req);
        res.send({
            message: "Session has been logged out",
            redirect: `${process.env.REACT_APP_PATH_SITE}/user/`,
            events: ['session:change']
        })
    }

    async handleLoginRequest(req, res, form) {
        switch(req.body.service) {
            case 'email':
                if(!req.body.email)
                    throw new Error("Invalid email");
                await this.send2FactorEmail(req);
                res.send({
                    message: "A 2-Factor code sent to your email address. Please use it to log in",
                    events: [['modal:show', `${process.env.REACT_APP_PATH_SITE}/user/login-2factor.md?email=${req.body.email}`]]
                })
                break;

            case 'email-2factor-response':
                await this.loginWith2Factor(req);
                res.send({
                    message: "You are now logged in",
                    showModal: `${process.env.REACT_APP_PATH_SITE}/user/login-2factor-success.md`,
                    redirect: `${process.env.REACT_APP_PATH_SITE}/user/`,
                    events: [
                        ['modal:show', `${process.env.REACT_APP_PATH_SITE}/user/login-2factor-success.md`],
                        ['session:change']
                    ]
                });
                break;
            default:
            case 'google':
                throw new Error("Not implemented: " + req.body.service);
        }
    }

    static fromRequest(req) {
        return new UserSession();
    }


    async send2FactorEmail(req) {
        const values = Object.assign({}, req.body);
        const email = values.email;
        const code2Factor = crypto.randomInt(1000,9999);

        values.remoteAddress = req.headers['x-forwarded-for'] ||
            req.socket.remoteAddress ||
            null;
        values.host = process.env.REACT_APP_PATH_PUBLIC || req.headers.origin;
        values.codeUrl = new URL(
            `${process.env.REACT_APP_PATH_SITE}/user/login-2factor.md?email=${email}&code=${code2Factor}`,
            values.host);
        values.loginUrl = new URL(
            `${process.env.REACT_APP_PATH_SITE}/user/login.md?email=${email}`,
            values.host);

        // Add 2 Factor
        active2FactorLogins[email] = code2Factor;
        if(process.env.REACT_APP_2FACTOR_TIMEOUT)
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
            `${process.env.REACT_APP_PATH_SITE}/user/login-2factor.email.md`,
            values)

    }


    async loginWith2Factor(req) {
        const code2Factor = Number.parseInt(req.body.code);
        const email = req.body.email;
        if(active2FactorLogins[email] !== code2Factor)
            throw new Error("Invalid 2-Factor Code");

        delete active2FactorLogins[email];
        // req.session.reset();
        // Reset session
        req.session = {
            email
        };
        // console.log('req.session', req.session);
        // req.session.test = 'wut';
    }
}