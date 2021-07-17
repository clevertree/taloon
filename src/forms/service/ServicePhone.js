import FormHandler from "../../components/form/FormHandler";

FormHandler.addFormActionHandler('service-phone-post', ServicePhonePost);

function ServicePhonePost(req, form) {
    const validations = {};
    const values = req.body;

    // Handle Validations
    if (values.title)
        validations.title = "Title already in use: " + values.title;

    // Handle Errors


    // Return Errors or Preview
    if(req.query.preview
        || Object.values(validations).length > 0
        || !form.checkValidity())
        return { validations };



    // Perform Action
    return { message: "Form submitted successfully", validations};
}

export {
    ServicePhonePost
}