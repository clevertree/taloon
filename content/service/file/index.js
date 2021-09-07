import multer from 'multer';

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
            const upload = multer().single('file');
            upload(req, res, async function(err) {
                if(err) {
                    throw err;
                }
                const validations={}, changeValues={}, events=[], response = {validations, changeValues, events};
                const isPreview = (req.headers['form-preview']||'').toLowerCase() !== 'false';
                const userSession = server.getUserSession(req.session);
                // const {form, handleFormSubmission} = server.getFormHandler(req);


                // Check if form submission is a preview
                if(isPreview) {
                    res.status(202);

                } else {
                    if(!req.body.title)
                        validations.title = "Title is required";

                    // Check for active session
                    if (!userSession.isActive())
                        validations.email = "Please Log in to become a phone sponsor.";

                    // Handle Form Validation
                    if(Object.values(validations).length > 0) {
                        res.status(400);
                        response.message = Object.values(validations).join("\n");

                    } else {
                        const metadata = {};
                        if(req.body.labels)
                            metadata.labels = req.body.labels.split(/[, ]+/g).map(l => l.replace(/[^\w_-]+/g,""))
                        // Perform Action
                        const user = await userSession.getOrCreateUser();
                        const userFileDoc = await user.createFile(
                            req.body.filename,
                            req.file.buffer,
                            metadata
                        );

                        // Send Response
                        response.message = "New image has been uploaded successfully: " + userFileDoc.getFileName();
                        // events.push(['redirect', `${PATH_INDEX}?_id=${userFileDoc.getID()}`, 4000]);
                    }
                }
                res.send(response);
            })
    }
}


/** Unit Tests **/
export async function $test(agent, server, routePath) {
    /** Test Session Login **/
    const email = 'test@wut.ohok';
    const title = 'My Title';
    const filename = 'title.json';

    let res = await agent
        .post(process.env.REACT_APP_SERVICE_SESSION)
        .send({method: 'email', email})
        .set('Form-Preview', 'false')
        .expect(200)
    const {code2Factor} = res.body;

    /** Test Login 2Factor POST Request **/
    res = await agent
        .post(process.env.REACT_APP_SERVICE_SESSION)
        .send({method: 'email-2factor-response', code: code2Factor, email})
        .set('Form-Preview', 'false')
        .expect(200)

    /** Test File POST **/

    await agent
        .post(routePath)
        .field('title', title)
        .field('filename', filename)
        .set('Form-Preview', 'false')
        .attach('file', './package.json')
        .expect(isError)
        .expect('Content-Type', /json/)
        .expect(200)
    await agent
        .get(routePath)
        .expect(isError)
        .expect(200)
        .expect('Content-Type', /plain/)
    function isError(res) {
        if(res.status !== 200)
            throw new Error(`${routePath} (${res.status}): ${res.text}`);
    }
}

