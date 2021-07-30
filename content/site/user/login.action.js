import UserSession from "../../../src/user/UserSession";

module.exports = async function LogInAction(req, res, form) {

    // User Client class handles the login requests
    const userClient = new UserSession(req.session);
    await userClient.handleLoginRequest(req, res, form);
}

