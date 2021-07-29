import UserClient from "../../../src/user/UserClient";

module.exports = async function LoginAction(req, res, form) {

    // User Client class handles the login requests
    const user = UserClient.fromRequest(req);
    const validations = await user.handleLoginRequest(req);

    // Return Errors or Preview
    if (req.query.preview
        || Object.values(validations).length > 0
        || !form.checkValidity())
        return res.status(400).send({validations});

    // Perform Action
    return res.send({message: "Form submitted successfully"});
}

