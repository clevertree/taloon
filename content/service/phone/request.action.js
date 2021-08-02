// TODO: search for existing offers before posting request?

module.exports = function RequestAction(req, res, form) {
    const validations = {};
    const autofillValues = {};

    // Handle Session - if no session, send 2 factor (user is attempting to create a form with your email address)
    if (!req.session.email)
        validations['email'] = "Please Register or Log in to become a phone sponsor.";

    // req.session.reset();
    // console.log('req.session.test', req.session.test);
    // req.session.test = 'wut';

    // Handle Validations
    // if (req.body.title)
    //     validations.title = "Title already in use: " + req.body.title;


    // Return Validations on Preview
    if (req.query.preview)
        return res.status(202).send({validations, values: autofillValues, preview: true});

    // Return Error on failed validation
    if (Object.values(validations).length > 0 || !form.checkValidity())
        return res.status(400).send({validations, values: autofillValues, preview: !!req.query.preview});

    // Perform Action
    return res.send({message: "Form submitted successfully"});
}

