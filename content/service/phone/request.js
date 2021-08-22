const {REQUEST_URL} = require('./config.json')

module.exports = async function ServicePhoneRequest(req, res, server) {
    // const userSession = server.getUserSession(req.session);

    switch(req.method.toLowerCase()) {
        default:
        case 'get':
            // Return markdown content
            const userContentCollection = server.getUserContentCollection();
            if(req.query._id) {
                const contentDoc = await userContentCollection.queryUserFile(req.query._id, REQUEST_URL);
                res.send(contentDoc.getContent());
            } else {
                // const contentDocs = await userContentCollection.queryUserFiles({actions: REQUEST_URL});
                // res.send('found ' + contentDocs.length);

                const markdownPage = server.getContentFile(`${__dirname}/index.view.md`);
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
