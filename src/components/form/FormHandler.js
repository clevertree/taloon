import path from "path";
import fs from "fs";
import {JSDOM} from "jsdom";

class FormHandler {

    static async handleFormRequest(req, res, formActionCallback) {
        try {
            let formPath = req.query.markdownPath;
            if (!formPath)
                throw new Error("Missing parameter: markdownPath");
            formPath = formPath.split('?').shift();

            if(!req.query.formPosition)
                throw new Error("Missing parameter: formPosition");
            if (Number.isNaN(Number.parseInt(req.query.formPosition)))
                throw new Error("Invalid integer: formPosition");

            let formPosition = Number.parseInt(req.query.formPosition);
            // console.log("Form found: ", {formPath, formPosition})

            const pathIndexMD = path.resolve(process.env.REACT_APP_PATH_CONTENT, formPath);
            // const pathIndexMD = path.resolve(PATH_CONTENT, formPath);
            if (!fs.existsSync(pathIndexMD))
                throw new Error("Markdown page not found: " + formPath);

            const markdownHTML = fs.readFileSync(pathIndexMD, 'utf8');
            const DOM = new JSDOM(markdownHTML);
            const document = DOM.window.document;

            const forms = [...document.querySelectorAll('form')];
            if (!forms[formPosition])
                throw new Error(`Form Position ${formPosition} not found`);
            const form = forms[formPosition];

            for (const element of form.elements)
                if (element.name)
                    element.value = req.body[element.name];
            if (!req.query.preview && !form.checkValidity()) {
                throw new Error("Form failed validation"); // Shouldn't happen ;(
            }

            await formActionCallback(req, res, form);

        } catch (err) {
            console.error("Error submitting form: ", err.message);
            // res.statusMessage = err.message;
            return res.status(400).send(JSON.stringify({
                message: err.message,
            }));
        }
    }

    static setupRoutes(app) {
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