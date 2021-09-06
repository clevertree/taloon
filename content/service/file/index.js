// const {CONTENT_LABEL} = require('./image.config.json')
export default async function ServiceFile(req, res, server) {
    const PATH_BASE = server.getRelativeContentPath(__dirname);
    const PATH_ASSETS = `${PATH_BASE}/assets`;
    // const userSession = server.getUserSession(req.session);
    const {UserFile: userFileCollection} = server.getCollections();

    switch(req.method.toLowerCase()) {
        default:
        case 'get':
            const {title, location, distance} = req.body;
            const searchValues = {title, location, distance};
            const userFileDoc = await userFileCollection.getUserFile(searchValues);
            res.setHeader('Content-Type', userFileDoc.getContentType());
            await userFileDoc.pipeStream(res);
            break;

        case 'post':
            const validations={}, changeValues={}, events=[], response = {validations, changeValues, events};
            const isPreview = (req.headers['form-preview']||'').toLowerCase() !== 'false';
            const userSession = server.getUserSession(req.session);
            // const {form, handleFormSubmission} = server.getFormHandler(req);



            if (userSession.isActive()) {
                // const localUser = await userSession.getOrCreateUser();
                const user = await userSession.getOrCreateUser();
                if(await user.hasFile(req.body.title))
                    validations.title = "This title is already in use. Please try another"

            }

            // Check if form submission is a preview
            if(isPreview) {
                res.status(202);

            } else {
                // Check for active session
                if (!userSession.isActive()) {
                    // Session is required
                    validations.email = "Please Log in to become a phone sponsor.";
                }
                if(!req.body.title)
                    validations.title = "Title is required";

                // Handle Form Validation
                if(Object.values(validations).length > 0) {
                    res.status(400);
                    response.message = Object.values(validations).join("\n");

                } else {
                    // Perform Action
                    const user = await userSession.getOrCreateUser();
                    const userFileDoc = await user.createFileFromTemplate(`${PATH_ASSETS}/request.template.md`,
                        req.body.title,
                        req.body,
                        [CONTENT_LABEL],
                        req.body.location
                    );

                    // Send Response
                    response.message = "New post has been created successfully";
                    events.push(['redirect', `${PATH_INDEX}?_id=${userFileDoc.getID()}`, 4000]);
                }
            }
            return res.send(response);
    }
}


/** Unit Tests **/
export async function $test(agent, server, routePath) {
    await agent
        .post(routePath)
        .send({name: 'john'})
        .set('Accept', 'application/json')
        .expect(isJSONError)
        .expect('Content-Type', /json/)
        .expect(200)
    await agent
        .get(routePath)
        .expect(200)
        .expect('Content-Type', /markdown/)
    function isJSONError(res) {
        if(!res.type.includes('json') || res.status !== 200)
            throw new Error(`${routePath}: ${res.text}`);
    }
}

