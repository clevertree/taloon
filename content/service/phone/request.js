
const {CONTENT_LABEL} = require('./phone.config.json')

export default async function ServicePhoneRequest(req, res, server) {
    const PATH_ASSETS = server.getRelativeContentPath(__dirname) + '/assets';

    // const userSession = server.getUserSession(req.session);
    const {UserFile:userFileCollection} = server.getCollections();

    switch(req.method.toLowerCase()) {
        default:
        case 'get':
            res.setHeader('Content-Type', 'text/markdown');
            // Return markdown content
            let content;
            try {
                if (!req.query._id)
                    throw new Error("Invalid Request ID");
                const fileDoc = await userFileCollection.getUserFile({...req.query, labels: CONTENT_LABEL});
                // res.setHeader('Content-Type', fileDoc.getContentType());
                content = fileDoc.renderHTMLTag();
            } catch (e) {
                content = `<error>${e}</error>`;
            }
            content = await server.getContentFile(`${PATH_ASSETS}/request.view.md`, {}, {content});
            res.send(content);
            break;

        case 'post':
            const validations={}, changeValues={}, events=[], response = {validations, changeValues, events};
            const isPreview = (req.headers['form-preview']||'').toLowerCase() !== 'false';
            // const {form, handleFormSubmission} = server.getFormHandler(req);

            // Handle Form Validations


            // Check if form submission is a preview
            if(isPreview)
                return res.status(202).send(response);
            // Check if any validations exist
            if(Object.values(validations).length > 0)
                return res.status(400).send({message: "Form Validation Failed", ...response});


            // Perform Action
            // const user = await userSession.getOrCreateUser();
            // const userFileDoc = await user.createFileFromTemplate('./service/phone/request.template.md', req.body.title, req.body);

            // Send Response
            response.message = "New request has been created successfully";
            // events.push(['redirect', `/service/phone/post.js?_id=${userFileDoc.getID()}`, 2000]);
            return res.send(response);
    }
}


/** Unit Tests **/
export async function $test(agent, server, routePath) {
    const {User:userCollection} = server.getCollections();
    const filename = 'test/unit-test.md';
    const title = 'Unit Test File';
    const content = '# Unit Test Content';
    const email = 'test@wut.com';
    const testUser = await userCollection.createUser(email);
    const userFile = await testUser.createFile(filename, content, {
        title,
        labels: CONTENT_LABEL
    });

    /** Test GET Request **/
    await agent
        .get(routePath + '?_id=' + userFile.getID())
        .expect(200)
        .expect('Content-Type', /markdown/)

    /** Test POST Request **/
    await agent
        .post(routePath)
        .send({title: 'Test Request'})
        .set('Form-Preview', 'false')
        .expect(isJSONError)
        .expect(200)
        .expect('Content-Type', /json/)

    function isJSONError(res) {
        if(!res.type.includes('json') || res.status !== 200)
            throw new Error(res.text);
    }

    /** Clean up **/
    await testUser.delete();
}
