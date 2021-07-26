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
            const formPath = req.query.path;
            if (!formPath)
                throw new Error("Invalid form path");
            const PATH_CONTENT = path.resolve(process.env.REACT_APP_PATH_CONTENT);

            const pathIndexMD = path.resolve(PATH_CONTENT + formPath, 'index.md');
            if (!fs.existsSync(pathIndexMD))
                throw new Error("Markdown page not found: " + path.resolve(formPath, 'index.md'));

            const markdownHTML = fs.readFileSync(pathIndexMD, 'utf8');
            const DOM = new JSDOM(markdownHTML);
            const document = DOM.window.document;

            let formName = req.query.name || 0;
            const forms = [...document.querySelectorAll('form')];
            if (!Number.isNaN(Number.parseInt(formName))) {
                const formID = Number.parseInt(formName);
                if (!forms[formID])
                    throw new Error(`Form ID ${formID} not found`);
                const form = forms[formID];
                return this.processFormRequest(form, req, res);
            }

            for (const form of forms)
                if (form.getAttribute('name') === formName)
                    return this.processFormRequest(form, req, res);

            throw new Error("No Forms were found: " + formPath);
        } catch (err) {
            console.error("Error submitting form: ", err.message);
            // res.statusMessage = err.message;
            return res.status(400).send(JSON.stringify({
                errors: [err.message]
            }));
        }
    }

    static processFormRequest(form, req, res) {
        const formName = form.name;
        if (!formName)
            throw new Error("Invalid form name");

        if (!formHandlers[formName])
            throw new Error(`Form name not found: ${formName}`)
        const formHandler = formHandlers[formName];

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
            errors: ["No response from form handler"]
        }

        res.status(200).send(jsonResponse);
    }

    static setupRoutes(app) {
        app.post('/:form-submit', this.handleRequest.bind(this));

    }
}
export default FormHandler;