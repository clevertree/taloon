module.exports = function LoginAction(req, res, form) {
    const validations = {};
    const values = req.body;
    console.log("Login: ", values);

    // req.session.reset();
    // console.log('req.session.test', req.session.test);
    // req.session.test = 'wut';


    // Return Errors or Preview
    if (req.query.preview
        || Object.values(validations).length > 0
        || !form.checkValidity())
        return res.status(400).send({validations});

    // Perform Action
    return res.send({message: "Form submitted successfully"});
}

