import FormHandler from "../../../components/form/FormHandler";

FormHandler.addFormActionHandler('service-phone-post', ServicePhonePost);

function ServicePhonePost(req, form) {
    let message = null;
    const errors = [];
    const validations = {};
    const result = {
        message, errors, validations
    }
    const values = req.body;

    // Validations
    if (values.title)
        validations.title = "Title already in use: " + values.title;

    // Handle Errors

    if(req.query.preview)
        return result;

    if(errors.length > 0)
        return result;

    if(!form.checkValidity())
        throw new Error("Form failed to validate"); // TODO: show fields and reasons?

    // Perform Action
    result.message = "Form submitted successfully";
    return result;
}

export {
    ServicePhonePost
}