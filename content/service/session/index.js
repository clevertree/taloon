import EmailServer from "../../../src/server/email/EmailServer";


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

        switch(req.body.method) {
            case 'email':
                await handleEmailLogin();
                break;

            case 'email-2factor-response':
                await handle2FactorResponse();
                break;

            case 'status':
                await handleStatusResponse();
                break;

            case 'logout':
                await handleLogoutResponse();
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

                    values.codeUrl = new URL(`${process.env.REACT_APP_SERVICE_SESSION}?view=email-2factor-response&email=${email}&code=${code2Factor}`, values.host);
                    values.loginUrl = new URL(`${process.env.REACT_APP_SERVICE_SESSION}?view=login&email=${email}`, values.host);
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
                    events.push(['form:save', process.env.REACT_APP_SERVICE_SESSION, storeFormValues]);
                    events.push(['modal:show', `${process.env.REACT_APP_SERVICE_SESSION}?view=login-2factor`]);
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
                events.push(['modal:show', `${process.env.REACT_APP_SERVICE_SESSION}?view=login-success`]);
                events.push(['modal:close', 4000]);
                events.push(['session:change']);
            }
            res.send(response);
        }

        async function handleStatusResponse() {
            /** Post Request **/
            const userClient = server.getUserSession(req.session);
            res.send({
                isActive: userClient.isActive(),
                email: userClient.getEmail() || null
            });
        }

        async function handleLogoutResponse() {
            // TODO: validation

            // Check if form submission is a preview
            if (isPreview)
                return res.status(202).send(response);
            // Check if any validations exist
            if (Object.values(validations).length > 0)
                return res.status(400).send({message: "Form Validation Failed", ...response});
            // Perform Action

            // User Client class handles the login requests
            const userClient = server.getUserSession(req.session);
            userClient.logout(req)

            response.message = "You have been logged out. This modal will close automatically.";
            events.push(['modal:show', `${process.env.REACT_APP_SERVICE_SESSION}?view=logout-success`]);
            events.push(['modal:close', 4000]);
            events.push(['session:change']);
            res.send(response);
        }
    }

}


/** Unit Tests **/
export async function $test(agent, server, routePath) {
    // const {User:userCollection, UserPost: userPostCollection} = server.getCollections();
    /** Test Login POST Request **/
    const email = 'test@wut.ohok';

    // Delete existing user posts
    // const user = await userCollection.getUser({email});

    let res = await agent
        .post(process.env.REACT_APP_SERVICE_SESSION)
        .send({method: 'email', email})
        .set('Accept', 'application/json')
        .set('Form-Preview', 'false')
        .expect(isJSONError)
        .expect(200)
        .expect('Content-Type', /json/)
    const {code2Factor} = res.body;

    /** Test Login 2Factor POST Request **/
    res = await agent
        .post(process.env.REACT_APP_SERVICE_SESSION)
        .send({method: 'email-2factor-response', code: code2Factor, email})
        .set('Accept', 'application/json')
        .set('Form-Preview', 'false')
        .expect(isJSONError)
        .expect(200)
        .expect('Content-Type', /json/)


    function isJSONError(res) {
        if(!res.type.includes('json') || res.status !== 200)
            throw new Error(`${routePath}: ${res.text}`);
    }
}

