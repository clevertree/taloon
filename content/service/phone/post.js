module.exports = {

    handleGetRequest: (req, res) => {
        res.send("# WTF  " + req.query._id);
        // Return markdown content
    },

    handleFormRequest: async (form, req, stats) => {
        const {userSession} = stats;
        // Load form inputs
        let inputEmail = form.elements.email;
        // let inputFileName = form.elements.fileName;

        // Handle Validations

        // Check for active session
        if (userSession.isActive()) {
            // const localUser = await userSession.getOrCreateLocalUser();

        } else {
            // Email field may need to be set enabled and required
            inputEmail.required = true;
            inputEmail.disabled = false;
            inputEmail.setCustomValidity("Please Register or Log in to become a phone sponsor.");
        }

        // const fileName = inputFileName.value;

        // Return action as a function
        return async function(res) {
            // Perform Action
            const localUser = await userSession.getOrCreateLocalUser();
            const userFileDoc = await localUser.createFileFromTemplate('./service/phone/request.template.md', req.body.title, req.body);

            return {
                message: "Phone Post has been created successfully",
                events: [
                    ['redirect', `/service/phone/post.js?_id=${userFileDoc.getID()}`, 2000],
                ]
            }
        }
    }
}
