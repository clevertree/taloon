module.exports = function RequestAction(req, res, form) {
    const validations = {};
    const values = req.body;

    // Handle Session - if no session, send 2 factor (user is attempting to create a form with your email address)
    if (!req.session.email)
        validations['email'] = "Please Register or Log in to become a phone sponsor.";

    // req.session.reset();
    // console.log('req.session.test', req.session.test);
    // req.session.test = 'wut';

    // Handle Validations
    if (values.title)
        validations.title = "Title already in use: " + values.title;


    // Return Errors or Preview
    if (req.query.preview
        || Object.values(validations).length > 0
        || !form.checkValidity())
        return res.status(400).send({validations});

    // Perform Action
    return res.send({message: "Form submitted successfully"});
}

