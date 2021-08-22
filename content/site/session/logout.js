import UserSession from "../../../src/server/session/UserSession";

module.exports = function LogOutAction(form, req) {


    // Return action as a function
    return function(res) {
        // Perform Action

        // User Client class handles the login requests
        const userClient = new UserSession(req.session);
        return userClient.processLogOutRequest(req);
    }
}

