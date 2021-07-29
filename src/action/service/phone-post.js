export default function PhonePost(req, form) {
    const validations = {};
    const values = req.body;

    // Handle Session
    // console.log("Session", req.session);
    // TODO: if no session, send 2 factor (user is attempting to create a form with your email address)
    // TODO: return button & input signal to send & receive 2 factor. ask to keep session alive
    if(!req.session.email)
        validations['email'] = "Please Register or Log in to become a phone sponsor.";

    // req.session.reset();
    console.log('req.session.test', req.session.test);
    req.session.test = 'wut';

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


