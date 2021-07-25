import cookieSession from "cookie-session";

export default class SessionServer {

    static setupRoutes(app) {
        this.app = app;

        app.set('trust proxy', 1) // trust first proxy

        app.use(cookieSession({
            name: process.env.REACT_APP_SESSION_COOKIE, // cookie name dictates the key name added to the request object
            keys: process.env.REACT_APP_SESSION_KEYS.split(/[,;]+/g), // should be a large unguessable string
        }));
    }
}
