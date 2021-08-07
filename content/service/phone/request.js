// import path from "path";
// import fs from "fs";
// import UserSession from "../../../src/user/UserSession";
// TODO: search for existing offers before posting request?

module.exports = function RequestPhoneServiceAction(form, req) {
    // Handle Validations

    // Check for active session
    // const userSession = new UserSession(req.session);
    // if (userSession.isActive()) {
    // } else {
    //     form.elements["email"].setCustomValidity("Please Register or Log in to request a phone.");
    // }

    // Return action as a function
    return function(res) {
        // Perform Action

        return {
            message: "Phone Request has been sent",
            events: [
                ['redirect', `${process.env.REACT_APP_PATH_SITE}/user/`, 2000],
            ]
        }
    }
}

