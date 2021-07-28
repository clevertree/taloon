import path from "path";
import fs from "fs";
import {JSDOM} from "jsdom";

const formHandlers = {};
class FormHandler {
    static addFormActionHandler(actionName, callback) {
        formHandlers[actionName] = callback;
    }

    static handleRequest(req, res, next) {
        try {
            const formPath = req.query.markdownPath;
            if (!formPath)
                throw new Error("Missing parameter: markdownPath");
            const PATH_CONTENT = path.resolve(process.env.REACT_APP_PATH_CONTENT);

            const pathIndexMD = path.resolve(PATH_CONTENT, formPath);
            if (!fs.existsSync(pathIndexMD))
                throw new Error("Markdown page not found: " + formPath);

            const markdownHTML = fs.readFileSync(pathIndexMD, 'utf8');
            const DOM = new JSDOM(markdownHTML);
            const document = DOM.window.document;

            if(!req.query.formPosition)
                throw new Error("Missing parameter: formPosition");
            if (Number.isNaN(Number.parseInt(req.query.formPosition)))
                throw new Error("Invalid integer: formPosition");
            let formPosition = Number.parseInt(req.query.formPosition);
            const forms = [...document.querySelectorAll('form')];
            if (!forms[formPosition])
                throw new Error(`Form Position ${formPosition} not found`);
            const form = forms[formPosition];
            return FormHandler.processFormRequest(form, req, res);

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

        if (!formHandlers[action])
            throw new Error(`Form action not found: ${action}`)
        const formHandler = formHandlers[action];

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
        app.post('/form-submit', FormHandler.handleRequest);

    }
}
export default FormHandler;