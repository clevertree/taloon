import UserSession from "../../../src/user/UserSession";

module.exports = async function LogInAction(req, res, form) {

    // Return Errors or Preview
    if (req.query.preview)
        return res.status(202).send({preview: true});

    // User Client class handles the login requests
    const userClient = new UserSession(req.session);
    await userClient.handleLogInRequest(req, res, form);
}

