import UserSession from "../../../src/user/UserSession";

module.exports = function LogOutAction(req, res, form) {

    // User Client class handles the login requests
    const userClient = new UserSession(req.session);
    userClient.handleLogOutRequest(req, res);
}

