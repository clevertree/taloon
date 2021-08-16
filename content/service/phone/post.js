const REQUEST_URL = require('./request.js').REQUEST_URL;
module.exports = async function ServicePhonePost(req, res, server) {
    // const userSession = server.getUserSession(req.session);

    switch(req.method.toLowerCase()) {
        default:
        case 'get':
            const markdownPage = server.getContentFile(`${__dirname}/post.view.md`);
            res.send(markdownPage);
            break;

        case 'post':
            const validations={}, changeValues={}, events=[], response = {validations, changeValues, events};
            const isPreview = (req.headers['form-preview']||'').toLowerCase() !== 'false';
            const userSession = server.getUserSession(req.session);
            // const {form, handleFormSubmission} = server.getFormHandler(req);

            // Handle Form Validations
            // validations.title = "Please Register or Log in to become a phone sponsor.";

            // Check for active session
            if (userSession.isActive()) {
                // const localUser = await userSession.getOrCreateUser();
                const user = await userSession.getOrCreateUser();
                if(await user.hasFile(req.body.title))
                    validations.title = "This title is already in use. Please try another"

            } else {
                // Email field may need to be set enabled and required
                validations.email = "Please Register or Log in to become a phone sponsor.";
            }

            // Check if form submission is a preview
            if(isPreview)
                return res.status(202).send(response);
            // Check if any validations exist
            if(Object.values(validations).length > 0)
                return res.status(400).send({message: "Form Validation Failed", ...response});


            // Perform Action
            const user = await userSession.getOrCreateUser();
            const userFileDoc = await user.createFileFromTemplate(`${__dirname}/request.template.md`, req.body.title, req.body);

            // Send Response
            response.message = "New post has been created successfully";
            events.push(['redirect', `${REQUEST_URL}?_id=${userFileDoc.getID()}`, 4000]);
            return res.send(response);
    }
}