import UserSession from "../../../src/user/UserSession";

module.exports = async function LogInAction(req, res, form) {
    const validations = {};
    const autofillValues = {};

    // if(!req.body.email) // TODO: auto fill email
        // autofillValues.fileName = findAvailableFile(localUser);


    // Return Validations on Preview
    if (req.query.preview)
        return res.status(202).send({validations, values: autofillValues, preview: true});

    // User Client class handles the login requests
    const userClient = new UserSession(req.session);
    await userClient.handleLogInRequest(req, res, form);
}

