const {PATH_USER_HOME} = require('../../config.json');

module.exports = async function LogOutAction(req, res, server) {


    const validations={}, changeValues={}, events=[], response = {validations, changeValues, events};
    const isPreview = (req.headers['form-preview']||'').toLowerCase() !== 'false';

    // TODO: validation

    // Check if form submission is a preview
    if(isPreview)
        return res.status(202).send(response);
    // Check if any validations exist
    if(Object.values(validations).length > 0)
        return res.status(400).send({message: "Form Validation Failed", ...response});
    // Perform Action

    // User Client class handles the login requests
    const userClient = server.getUserSession(req.session);
    userClient.logout(req)

    return {
        message: "You have been logged out. This modal will close automatically.",
        events: [
            ['redirect', PATH_USER_HOME, 5000],
            ['modal:show', `${process.env.REACT_APP_PATH_SITE}/session/logout-success.md`],
            ['modal:close', 5000],
            ['session:change']
        ]
    }

}

