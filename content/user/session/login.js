import SiteConfig from "../../config.json";
import path from "path";

export default async function UserSessionLogIn(req, res, server, routePath) {
    const PATH_ASSETS = path.join(path.dirname(routePath), 'assets');

    if(req.method.toLowerCase() !== 'post') {
        const markdownPage = server.getContentFile(`${PATH_ASSETS}/login.view.md`);
        res.setHeader('Content-Type', 'text/markdown');
        res.send(markdownPage);
        return;
    }

    // User Client class handles the login requests
    const userClient = server.getUserSession(req.session);
    switch(req.body.service) {
        case 'email':
            const {email, code2Factor} = await userClient.processSend2FactorEmailRequest(req, SiteConfig.PATH_LOGIN, `${PATH_ASSETS}/login-success.view.md`);

            let storeFormValues = {email};

            const ret = {
                message: "A 2-Factor code sent to your email address. Please use it to log in",
                events: [
                    ['form:save', SiteConfig.PATH_LOGIN, storeFormValues],
                    ['modal:show', `${PATH_ASSETS}/login-2factor.view.md`]
                ]
            };
            if(['test', 'development'].includes(process.env.NODE_ENV)) {
                storeFormValues.code = code2Factor;
                ret.code2Factor = code2Factor;
            }
            return res.send(ret);

        case 'email-2factor-response':
            userClient.processLoginWith2FactorRequest(req);

            return res.send({
                message: "You are now logged in. This modal will close automatically.",  // Redirecting...
                events: [
                    ['redirect', SiteConfig.PATH_USER_HOME, 5000],
                    ['modal:show', `${PATH_ASSETS}/login-success.view.md`],
                    ['modal:close', 5000],
                    ['session:change'],
                    // ['redirect', `${process.env.REACT_APP_PATH_SITE}/user/`, 5000], // TODO: redirect optionally
                ]
            });

        default:
        case 'google':
            throw new Error("Not implemented: " + req.body);
    }

}

