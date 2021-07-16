

export default class EmailServer {

    static handleEmailValidation(req, res, next) {
        return undefined;
    }

    static setupRoutes(app) {
        this.app = app;

        app.post(':email-validation', (req, res, next) => {
            return this.handleEmailValidation(req, res, next);
        });
    }

}
