import crypto from 'crypto';
import cookieSession from "cookie-session";

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

    // async processLogOutRequest(req) {
    //     this.logout(req);
    // }


    generate2FactorCode(email) {
        const code2Factor = crypto.randomInt(1000,9999);
        // Add 2 Factor
        active2FactorLogins[email] = code2Factor;
        if(process.env.REACT_APP_2FACTOR_TIMEOUT)
            setTimeout(() => delete active2FactorLogins[email], process.env.REACT_APP_2FACTOR_TIMEOUT);
        return code2Factor;
    }

    loginWith2FactorCode(req, email, code2Factor) {
        if(active2FactorLogins[email] !== code2Factor)
            throw new Error("Invalid 2-Factor Code");

        delete active2FactorLogins[email];
        this.login(req, email);
    }


    static setupRoutes(app) {
        this.app = app;

        app.set('trust proxy', 1) // trust first proxy

        app.use(cookieSession({
            name: process.env.REACT_APP_SESSION_COOKIE, // cookie name dictates the key name added to the request object
            keys: process.env.REACT_APP_SESSION_KEYS.split(/[,;]+/g), // should be a large unguessable string
        }));

        // app.post('/session', this.handleSessionRequest)
    }

}