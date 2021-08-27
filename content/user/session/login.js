import EmailServer from "../../../src/server/email/EmailServer";

const {PATH_USER_LOGIN} = require('../../config.json');

export default async function UserSessionLogIn(req, res, server) {
    const PATH_BASE = server.getRelativeContentPath(__dirname);
    const PATH_ASSETS = `${PATH_BASE}/assets`;

    if(req.method.toLowerCase() !== 'post') {
        /** Get Request **/
        let view = (req.query.view || 'login').replace(/[^\w_-]+/g," ");;
        let viewPath = `${PATH_ASSETS}/${view}.view.md`;
        const markdownPage = await server.getContentFile(viewPath);
        res.setHeader('Content-Type', 'text/markdown');
        res.send(markdownPage);

    } else {
        /** Post Request **/
        const validations={}, changeValues={}, events=[], response = {validations, changeValues, events};
        const isPreview = (req.headers['form-preview']||'').toLowerCase() !== 'false';
        const userClient = server.getUserSession(req.session);

        switch(req.body.service) {
            case 'email':
                await handleEmailLogin();
                break;

            case 'email-2factor-response':
                await handle2FactorResponse();
                break;

            default:
            case 'google':
                throw new Error("Not implemented: " + req.body.service);
        }

        async function handleEmailLogin() {
            // Validation
            const email = req.body.email;
            if(!/\S+@\S+\.\S+/.test(email))
                validations['email'] = "Invalid Email";

            // Check if form submission is a preview
            if(isPreview) {
                res.status(202);

            } else {

                // Check if any validations exist
                // Handle Form Validation
                if(Object.values(validations).length > 0) {
                    res.status(400);
                    response.message = Object.values(validations).join("\n");

                } else {

                    const code2Factor = userClient.generate2FactorCode(email);
                    const values = {
                        email,
                        code2Factor,
                        remoteAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress || null,
                        host: req.headers.origin || process.env.REACT_APP_ORIGIN,
                    };

                    values.codeUrl = new URL(`${PATH_USER_LOGIN}?service=email-2factor-response&email=${email}&code=${code2Factor}`, values.host);
                    values.loginUrl = new URL(`${PATH_USER_LOGIN}?email=${email}`, values.host);
                    values.sessionDetails
                        = `Date: ${new Date().toLocaleString()}`
                        + `Email: ${values.email}`
                        + `IP Address: ${values.remoteAddress || 'N/A'}`
                        + `Browser: ${req.headers["user-agent"] || 'N/A'}`
                        + `Ref: ${req.headers.referrer || 'N/A'}`

                    // User Client class handles the login requests
                    // const {email, code2Factor} = await userClient.processSend2FactorEmailRequest(req, PATH_USER_LOGIN, `${PATH_ASSETS}/login-success.view.md`);

                    await EmailServer.sendMarkdownTemplateEmail(
                        email,
                        'Use this code to log in',
                        `${PATH_ASSETS}/login-2factor.email.md`,
                        values)
                    
                    let storeFormValues = {email};

                    response.message = "A 2-Factor code sent to your email address. Please use it to log in";
                    events.push(['form:save', PATH_USER_LOGIN, storeFormValues]);
                    events.push(['modal:show', `${PATH_USER_LOGIN}?view=login-2factor`]);
                    if(['test', 'development'].includes(process.env.NODE_ENV)) {
                        storeFormValues.code = code2Factor;
                        response.code2Factor = code2Factor;
                    }
                }
            }
            res.send(response);
        }
    
        async function handle2FactorResponse() {
            // Validation
            const email = req.body.email;
            if(!/\S+@\S+\.\S+/.test(email))
                validations['email'] = "Invalid Email";
            const code = parseInt(req.body.code);
            if(!code || isNaN(code))
                validations['code'] = "Invalid 2-Factor Code";

            // Check if any validations exist
            // Handle Form Validation
            if(Object.values(validations).length > 0) {
                if(isPreview) {
                    res.status(202);
                } else {
                    res.status(400);
                    response.message = Object.values(validations).join("\n");
                }
            } else {

                await userClient.loginWith2FactorCode(req, email, code);

                response.message = "You are now logged in. This modal will close automatically.";
                // events.push(['redirect', PATH_USER_HOME, 5000]);
                events.push(['modal:show', `${PATH_USER_LOGIN}?view=login-success`]);
                events.push(['modal:close', 4000]);
                events.push(['session:change']);
            }
            res.send(response);
        }
    }

}

