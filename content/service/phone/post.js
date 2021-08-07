module.exports = {

    handleFormRequest: async (form, req, stats) => {
        const {userSession} = stats;
        // Load form inputs
        let inputEmail = form.elements.email;
        let inputFileName = form.elements.fileName;

        // Handle Validations

        // Check for active session
        if (userSession.isActive()) {
            const localUser = await userSession.getOrCreateLocalUser();

            // Auto fill fileName parameter
            if (!inputFileName.value) {
                inputFileName.value = localUser.findAvailableFile('phone');
            } else {
                if(localUser.hasFile(inputFileName.value)) {
                    inputFileName.setCustomValidity("Please choose a unique file name.");
                }
            }
        } else {
            // Email field may need to be set enabled and required
            inputEmail.required = true;
            inputEmail.disabled = false;
            inputEmail.setCustomValidity("Please Register or Log in to become a phone sponsor.");
        }

        const fileName = inputFileName.value;

        // Return action as a function
        return async function(res) {
            // Perform Action
            const localUser = await userSession.getOrCreateLocalUser();
            const relativePath = localUser.createFileFromTemplate(fileName, './service/phone/request.template.md', req.body);

            return {
                message: "Phone Post has been created successfully",
                events: [
                    ['redirect', relativePath, 2000],
                ]
            }
        }
    }

}
