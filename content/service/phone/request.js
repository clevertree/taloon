
module.exports = async (req, res, server) => {
    // const userSession = server.getUserSession(req.session);

    switch(req.method.toLowerCase()) {
        default:
        case 'get':
            // Return markdown content
            const userContentCollection = server.getUserContentCollection();
            const contentDoc = await userContentCollection.queryUserFile(req.query);
            res.setHeader('Content-Type', 'text/markdown');
            res.send(contentDoc.getContent());
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
