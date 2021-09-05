module.exports = async function LogOutAction(req, res, server) {
    const PATH_BASE = server.getRelativeContentPath(__dirname);
    const PATH_ASSETS = `${PATH_BASE}/assets`;

    if(req.method.toLowerCase() !== 'post') {
        /** Get Request **/
        let view = (req.query.view || 'logout').replace(/[^\w_-]+/g," ");;
        let viewPath = `${PATH_ASSETS}/${view}.view.md`;
        const markdownPage = await server.getContentFile(viewPath);
        res.setHeader('Content-Type', 'text/markdown');
        res.send(markdownPage);

    } else {

        const validations = {}, changeValues = {}, events = [], response = {validations, changeValues, events};
        const isPreview = (req.headers['form-preview'] || '').toLowerCase() !== 'false';

        // TODO: validation

        // Check if form submission is a preview
        if (isPreview)
            return res.status(202).send(response);
        // Check if any validations exist
        if (Object.values(validations).length > 0)
            return res.status(400).send({message: "Form Validation Failed", ...response});
        // Perform Action

        // User Client class handles the login requests
        const userClient = server.getUserSession(req.session);
        userClient.logout(req)

        response.message = "You have been logged out. This modal will close automatically.";
        events.push(['modal:show', `${process.env.REACT_APP_PATH_USER_LOGOUT}?view=logout-success`]);
        events.push(['modal:close', 4000]);
        events.push(['session:change']);
        res.send(response);
    }

}

