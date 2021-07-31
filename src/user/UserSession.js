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
            events: [
                ['modal:show', `${process.env.REACT_APP_PATH_SITE}/user/logout-success.md`],
                ['modal:close', 5000],
                ['session:change']
            ]
        })
    }

    handleLogInRequest(req, res, form) {
        switch(req.body.service) {
            case 'email':
                this.handleSend2FactorEmailRequest(req, res, form)
                    .then();
                break;

            case 'email-2factor-response':
                this.handleLoginWith2FactorRequest(req, res, form);
                break;
            default:
            case 'google':
                throw new Error("Not implemented: " + req.body.service);
        }
    }



    async handleSend2FactorEmailRequest(req, res, form) {
        const values = Object.assign({}, req.body);
        if(!req.body.email)
            throw new Error("Invalid email");
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

        res.send({
            message: "A 2-Factor code sent to your email address. Please use it to log in",
            events: [
                ['modal:show', `${process.env.REACT_APP_PATH_SITE}/user/login-2factor.md?email=${email}`]
            ]
        })
    }


    handleLoginWith2FactorRequest(req, res, form) {
        const code2Factor = Number.parseInt(req.body.code);
        const email = req.body.email;
        if(active2FactorLogins[email] !== code2Factor)
            throw new Error("Invalid 2-Factor Code");

        delete active2FactorLogins[email];

        // Reset session
        req.session = {
            email
        };

        res.send({
            message: "You are now logged in",
            redirect: `${process.env.REACT_APP_PATH_SITE}/user/`,
            events: [
                ['modal:show', `${process.env.REACT_APP_PATH_SITE}/user/login-success.md`],
                ['session:change'],
                ['modal:close', 5000]
            ]
        });
    }

}