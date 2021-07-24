import clientSessions from 'client-sessions';

export default class SessionServer {

    static setupRoutes(app) {
        this.app = app;
        app.use(clientSessions({
            cookieName: 'session', // cookie name dictates the key name added to the request object
            secret: 'cb1fbb07079625629cf5858718f33713', // should be a large unguessable string
            duration: 30 * 24 * 60 * 60 * 1000, // how long the session will stay valid in ms
            activeDuration: 24 * 1000 * 60 * 60 // if expiresIn < activeDuration, the session will be extended by activeDuration milliseconds
        }));
    }
}