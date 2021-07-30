import UserClient from "../../../src/user/UserClient";

module.exports = async function LoginAction(req, res, form) {

    // User Client class handles the login requests
    const user = UserClient.fromRequest(req);
    await user.handleLoginRequest(req, res, form);
}

