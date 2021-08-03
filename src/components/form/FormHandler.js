import path from "path";
import fs from "fs";
import {JSDOM} from "jsdom";

class FormHandler {

    static async handleFormRequest(req, res, formActionCallback) {
        try {
            let markdownPath = req.query.markdownPath;
            if (!markdownPath)
                throw new Error("Missing parameter: markdownPath");
            markdownPath = path.join(process.env.REACT_APP_PATH_CONTENT, markdownPath);

            if(!req.query.formPosition)
                throw new Error("Missing parameter: formPosition");
            if (Number.isNaN(Number.parseInt(req.query.formPosition)))
                throw new Error("Invalid integer: formPosition");

            let formPosition = Number.parseInt(req.query.formPosition);
            // console.log("Form found: ", {formPath, formPosition})

            if (!fs.existsSync(markdownPath))
                throw new Error("Markdown page not found: " + markdownPath);

            const markdownHTML = fs.readFileSync(markdownPath, 'utf8');
            const DOM = new JSDOM(markdownHTML);
            const document = DOM.window.document;

            const forms = [...document.querySelectorAll('form')];
            if (!forms[formPosition])
                throw new Error(`Form Position ${formPosition} not found`);
            const form = forms[formPosition];

            // Set form values based on request body
            for (const element of form.elements)
                if (element.name)
                    element.value = req.body[element.name];

            // Get failed validations
            const defaultValidations = {};
            for (const element of form.elements)
                if(element.name && !element.checkValidity())
                    defaultValidations[element.name] = element.validationMessage;

            // Perform action preview
            const callback = await formActionCallback(form, req);
            if(typeof callback !== "function")
                throw new Error("Form action callback returned a non-function: " + typeof callback);

            // Get failed validations
            const validations = {};
            for (const element of form.elements)
                if(element.name && !element.checkValidity() && defaultValidations[element.name] !== element.validationMessage)
                    validations[element.name] = element.validationMessage;

            // Get value changes
            const valueChanges = {}
            for (const element of form.elements)
                if(element.name && (element.value !== req.body[element.name]))
                    valueChanges[element.name] = element.value;

            // Return Validations on Preview
            if (req.query.preview)
                return res.status(202).send({validations, valueChanges, preview: true});

            if (!form.checkValidity())
                return res.status(400).send({validations, valueChanges, message: "Form failed validation"}); // Shouldn't happen

            console.log("Executing", form.action, req.body);

            // Perform action
            const responseJSON = await callback(res);
            if(responseJSON) {
                if(typeof responseJSON !== "object")
                    throw new Error("Invalid action response object");
                return res.status(200).send(responseJSON);
            }

        } catch (err) {
            console.error("Error submitting form: ", err);
            // res.statusMessage = err.message;
            return res.status(400).send(JSON.stringify({
                message: err.message,
            }));
        }
    }

    static setupRoutes(app) {
        walk(process.env.REACT_APP_PATH_CONTENT, (file) => {
            if(file.endsWith('.action.js')) {
                FormHandler.addRoute(app, file);
            }
        })
    }

    static addRoute(app, file) {
        const routePath = '/' + path.relative(process.env.REACT_APP_PATH_CONTENT, file);
        const formActionCallback = require(path.resolve(file));
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