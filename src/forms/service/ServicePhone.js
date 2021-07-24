import FormHandler from "../../components/form/FormHandler";

FormHandler.addFormActionHandler('service-phone-post', ServicePhonePost);

function ServicePhonePost(req, form) {
    const errors = {};
    const values = req.body;

    // Handle Session
    console.log("Session", req.session);
    // TODO: if no session, send 2 factor (user is attempting to create a form with your email address)
    // TODO: return button & input signal to send & receive 2 factor. ask to keep session alive
    if(!req.session.email)
        errors['@session_required'] = "Please Log in to complete this form.";

    // Handle Validations
    if (values.title)
        errors.title = "Title already in use: " + values.title;


    // Return Errors or Preview
    if(req.query.preview
        || Object.values(errors).length > 0
        || !form.checkValidity())
        return { success: false, errors };

    // Perform Action
    return { success: true, message: "Form submitted successfully"};
}

export {
    ServicePhonePost
}