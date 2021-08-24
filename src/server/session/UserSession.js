import EmailServer from "../email/EmailServer";
import crypto from 'crypto';

const active2FactorLogins = {};

export default class UserSession {
    constructor(session={}, server) {
        this.session = session;
        this.server = server;
    }

    isActive() { return !!this.session.email; }
    getEmail() { return this.session.email; }

    async getOrCreateUser() {
        if(!this.session.email)
            throw new Error("No valid user session");
        const email = this.session.email;
        const {User:userCollection} = this.server.getCollections();
        let foundUser = await userCollection.getUser({email}, false);
        if(foundUser)
            return foundUser;
        return await userCollection.createUser(email);
    }


    /** Session Status **/

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

    processLogOutRequest(req) {
        this.logout(req);
        return {
            message: "You have been logged out. This modal will close automatically.",
            redirect: `${process.env.REACT_APP_PATH_SITE}/session/`,
            events: [
                ['modal:show', `${process.env.REACT_APP_PATH_SITE}/session/logout-success.md`],
                ['modal:close', 5000],
                ['session:change']
            ]
        }
    }

    async processLogInRequest(req) {
        switch(req.body.service) {
            case 'email':
                return await this.processSend2FactorEmailRequest(req)

            case 'email-2factor-response':
                return this.processLoginWith2FactorRequest(req);
            default:
            case 'google':
                throw new Error("Not implemented: " + req.body);
        }
    }



    async processSend2FactorEmailRequest(req, pathLogin, path2FactorEmail) {
        const values = Object.assign({}, req.body);
        if(!req.body.email)
            throw new Error("Invalid email");
        const email = values.email;
        const code2Factor = crypto.randomInt(1000,9999);

        values.remoteAddress = req.headers['x-forwarded-for'] ||
            req.socket.remoteAddress ||
            null;
        values.host = req.headers.origin || process.env.REACT_APP_ORIGIN;
        values.codeUrl = new URL(
            `${pathLogin}?service=email-2factor-response&email=${email}&code=${code2Factor}`,
            values.host);
        values.loginUrl = new URL(
            `${pathLogin}?email=${email}`,
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
            path2FactorEmail,
            values)

        return {email, code2Factor};
    }


    processLoginWith2FactorRequest(req) {
        const code2Factor = Number.parseInt(req.body.code);
        const email = req.body.email;
        if(active2FactorLogins[email] !== code2Factor)
            throw new Error("Invalid 2-Factor Code");

        delete active2FactorLogins[email];

        // Reset session
        req.session = {
            email
        };
    }

}