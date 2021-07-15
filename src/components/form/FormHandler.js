import path from "path";
import fs from "fs";
import {JSDOM} from "jsdom";

class FormHandler {
    constructor() {
        this.formHandlers = {};
    }

    addFormActionHandler(actionName, callback) {
        this.formHandlers[actionName] = callback;
    }

    handleRequest(req, res, next) {
        try {
            const PATH_CONTENT = path.resolve(process.env.REACT_APP_PATH_CONTENT);

            const pathIndexMD = path.resolve(PATH_CONTENT + req.path, 'index.md');
            if (!fs.existsSync(pathIndexMD))
                throw new Error("Markdown page not found: " + path.resolve(req.path, 'index.md'));

            const markdownHTML = fs.readFileSync(pathIndexMD, 'utf8');
            const DOM = new JSDOM(markdownHTML);
            const document = DOM.window.document;

            let formName = req.query.formName || 0;
            const forms = [...document.querySelectorAll('form')];
            if (!Number.isNaN(formName)) {
                const formID = Number.parseInt(formName);
                if (!forms[formID])
                    throw new Error(`Form ID ${formID} not found`);
                const form = forms[formID];
                return this.processFormRequest(form, req, res);
            }

            for (const form of forms)
                if (form.getAttribute('name') === formName)
                    return this.processFormRequest(form, req, res);

            throw new Error("No Forms were found: " + req.path);
        } catch (err) {
            console.error("Error submitting form: ", err.message);
            res.statusMessage = err.message;
            return res.status(400).send(JSON.stringify({
                message: err.message
            }));
        }
    }

    processFormRequest(form, req, res) {
        const actionName = form.action;
        if(!actionName)
            throw new Error("Invalid form action");

        // Validate form
        const errors = [];
        for(const element of form.elements) {
            const name = element.name;
            if(name) {
                element.value = req.body[name];
                if(!element.checkValidity()) {
                    errors.push(`Field ${name} failed validation`);
                }
            }
        }

        if(errors.length > 0)
            throw new Error("Form failed validation: \n" + errors.join("\n"))

        if(!this.formHandlers[actionName])
            throw new Error(`Form action not found: ${actionName}`)
        const formHandler = this.formHandlers[actionName];

        const jsonResponse = formHandler(form, req) || {
            message: "No response from form handler"
        }

        res.status(200).send(jsonResponse);
    }
}

export default new FormHandler();