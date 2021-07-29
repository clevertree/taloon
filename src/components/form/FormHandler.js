import path from "path";
import fs from "fs";
import {JSDOM} from "jsdom";

const actionHandlers = {};
class FormHandler {
    /** @deprecated **/
    static addFormActionHandler(actionName, callback) {
        actionHandlers[actionName] = callback;
    }

    static handleFormRequest(req, res, formActionCallback) {
        try {
            const formPath = req.query.markdownPath;
            if (!formPath)
                throw new Error("Missing parameter: markdownPath");

            const PATH_CONTENT = path.resolve(process.env.REACT_APP_PATH_CONTENT);
            const pathIndexMD = path.resolve(PATH_CONTENT, formPath);
            if (!fs.existsSync(pathIndexMD))
                throw new Error("Markdown page not found: " + formPath);

            if(!req.query.formPosition)
                throw new Error("Missing parameter: formPosition");
            if (Number.isNaN(Number.parseInt(req.query.formPosition)))
                throw new Error("Invalid integer: formPosition");

            let formPosition = Number.parseInt(req.query.formPosition);
            const markdownHTML = fs.readFileSync(pathIndexMD, 'utf8');
            const DOM = new JSDOM(markdownHTML);
            const document = DOM.window.document;

            const forms = [...document.querySelectorAll('form')];
            if (!forms[formPosition])
                throw new Error(`Form Position ${formPosition} not found`);
            const form = forms[formPosition];
            formActionCallback(req, res, form);

        } catch (err) {
            console.error("Error submitting form: ", err.message);
            // res.statusMessage = err.message;
            return res.status(400).send(JSON.stringify({
                error: err.message,
                success: false
            }));
        }
    }

    static processFormRequest(form, req, res) {
        const action = form.action;
        if (!action)
            throw new Error("Invalid form action");

        if (!actionHandlers[action])
            throw new Error(`Form action not found: ${action}`)
        const formHandler = actionHandlers[action];

        // Validate form
        const validation = {};
        for (const element of form.elements) {
            const name = element.name;
            if (name) {
                element.value = req.body[name];
                // if(!element.checkValidity()) {
                //     validation[name] = `Field ${name} failed validation`;
                // }
            }
        }

        const jsonResponse = formHandler(req, form, validation) || {
            error: "No response from form handler",
            success: false
        }

        res.status(200).send(jsonResponse);
    }

    static setupRoutes(app) {
        if(Object.values(actionHandlers).length > 0)
            throw new Error("Routes already set up");
        // app.post('/form-submit', FormHandler.handleRequest);

        const PATH_CONTENT = path.resolve(process.env.REACT_APP_PATH_CONTENT);
        walk(PATH_CONTENT, (file) => {
            if(file.endsWith('.action.js')) {
                FormHandler.addRoute(app, file);
            }
        })
    }

    static addRoute(app, file) {
        const PATH_CONTENT = path.resolve(process.env.REACT_APP_PATH_CONTENT);
        const routePath = '/' + path.relative(PATH_CONTENT, file);
        const formActionCallback = require(file);
        const requestHandler = (req, res) =>
            FormHandler.handleFormRequest(req, res, formActionCallback);

        app.post(routePath, requestHandler);
        console.log("Added Route: ", routePath, formActionCallback);
        if(routePath.endsWith('.action.js')) {
            const subRoute = routePath.substr(0, routePath.length - 10);
            app.post(subRoute, requestHandler);
            console.log("Added Route: ", subRoute, formActionCallback);
        }
        if(actionHandlers[routePath])
            throw new Error("Route already has a handler: " + routePath);
        actionHandlers[routePath] = formActionCallback;
    }


}
export default FormHandler;

var walk = function(dir, callback) {
    var list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = dir + '/' + file;
        var stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            /* Recurse into a subdirectory */
            walk(file, callback);
        } else {
            /* Is a file */
            callback(file);
        }
    });
}