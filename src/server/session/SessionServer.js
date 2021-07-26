import cookieSession from "cookie-session";

export default class SessionServer {

    static setupRoutes(app) {
        this.app = app;

        app.set('trust proxy', 1) // trust first proxy

        app.use(cookieSession({
            name: process.env.REACT_APP_SESSION_COOKIE, // cookie name dictates the key name added to the request object
            keys: process.env.REACT_APP_SESSION_KEYS.split(/[,;]+/g), // should be a large unguessable string
        }));

        app.post('/:session', this.handleSessionRequest)
    }

    static handleSessionRequest(req, res, next) {
        res.send({
            isActive: SessionServer.hasActiveSession(req),
            email: req.session.email || null
        });
    }

    static hasActiveSession(req) {
        return !!req.session.email;
    }
}
