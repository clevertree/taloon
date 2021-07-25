import FormHandler from "../../components/form/FormHandler";

FormHandler.addFormActionHandler('service-phone-post', ServicePhonePost);

function ServicePhonePost(req, form) {
    const validations = {};
    const values = req.body;

    // Handle Session
    console.log("Session", req.session);
    // TODO: if no session, send 2 factor (user is attempting to create a form with your email address)
    // TODO: return button & input signal to send & receive 2 factor. ask to keep session alive
    if(!req.session.email)
        validations['@session_required'] = "Please Register or Log in to become a phone sponsor.";

    // Handle Validations
    if (values.title)
        validations.title = "Title already in use: " + values.title;


    // Return Errors or Preview
    if(req.query.preview
        || Object.values(validations).length > 0
        || !form.checkValidity())
        return { success: false, validations};

    // Perform Action
    return { success: true, message: "Form submitted successfully"};
}

export {
    ServicePhonePost
}