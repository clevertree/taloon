import path from "path";

const {REQUEST_URL} = require('./phone.config.json')

export default async function ServicePhoneRequest(req, res, server, routePath) {
    const PATH_ASSETS = path.join(path.dirname(routePath), 'assets');

    // const userSession = server.getUserSession(req.session);
    const {UserPost:userPostCollection} = server.getCollections();

    switch(req.method.toLowerCase()) {
        default:
        case 'get':
            res.setHeader('Content-Type', 'text/markdown');
            // Return markdown content
            if(req.query._id) {
                const contentDoc = await userPostCollection.getUserPost(req.query, REQUEST_URL);
                res.send(contentDoc.getContent());
            } else {
                // const contentDocs = await userContentCollection.queryUserFiles({actions: REQUEST_URL});
                // res.send('found ' + contentDocs.length);

                const markdownPage = server.getContentFile(`${PATH_ASSETS}/index.view.md`);
                res.send(markdownPage);
                break;
            }
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

    /** Test GET Request **/
    await agent
        .get(routePath)
        .expect(200)
        .expect('Content-Type', /markdown/)

    /** Test POST Request **/
    await agent
        .post(routePath)
        .send({title: 'Test Request'})
        .set('Accept', 'application/json')
        .set('Form-Preview', 'false')
        .expect(isJSONError)
        .expect(200)
        .expect('Content-Type', /json/)

    function isJSONError(res) {
        if(!res.type.includes('json') || res.status !== 200)
            throw new Error(res.text);
    }
}
