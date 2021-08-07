import UserSession from "../../../src/user/UserSession";

module.exports = function LogInAction(form, req) {


    // Return action as a function
    return async function(res) {
        // Perform Action

        // User Client class handles the login requests
        const userClient = new UserSession(req.session);
        return await userClient.processLogInRequest(req);
    }
}

