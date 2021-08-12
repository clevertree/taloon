
module.exports = async (req, res, server) => {
    // const userSession = server.getUserSession(req.session);
    const userContentCollection = server.getUserContentCollection();
    const contentDoc = await userContentCollection.queryUserFile(req.query);

    switch(req.method.toLowerCase()) {
        default:
        case 'get':
            // Return markdown content
            res.setHeader('Content-Type', 'text/markdown');
            res.send(contentDoc.getContent());
            break;

        case 'post':
            const userSession = server.getUserSession(req.session);
            const {form, handleFormSubmission} = server.getFormHandler(req, contentDoc.getContent());

            // Load form inputs
            let inputEmail = form.elements.email;
            // let inputFileName = form.elements.fileName;

            // Handle Validations

            // Check for active session
            if (userSession.isActive()) {
                // const localUser = await userSession.getOrCreateUser();

            } else {
                // Email field may need to be set enabled and required
                inputEmail.required = true;
                inputEmail.disabled = false;
                inputEmail.setCustomValidity("Please Register or Log in to become a phone sponsor.");
            }

            // const fileName = inputFileName.value;

            // Handle form submission
            await handleFormSubmission(res, async function(res) {
                // Perform Action
                const user = await userSession.getOrCreateUser();
                const userFileDoc = await user.createFileFromTemplate('./service/phone/request.template.md', req.body.title, req.body);

                return {
                    message: "Phone Post has been created successfully",
                    events: [
                        ['redirect', `/service/phone/post.js?_id=${userFileDoc.getID()}`, 2000],
                    ]
                }
            });

    }
}
