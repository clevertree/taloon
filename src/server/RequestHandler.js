import path from "path";
import fs from "fs";
import {JSDOM} from "jsdom";

export default class RequestHandler {

    /**
     * @param {string} routePath
     * @param config
     */
    constructor(routePath, config={
        // handleGetRequest: null,
        // handlePostRequest: null,
        // handleFormRequest: null,
    }) {
        this.routePath = routePath;
        this.config = config;
    }

    async handleRequest(req, res, next, stats) {
        try {
            switch(req.method.toLowerCase()) {
            case 'options':
                next();
                break;
            default:
            case 'get':
                if(typeof this.config.handleGetRequest !== "function")
                    throw new Error(".handleGetRequest is not implemented for GET " + this.routePath);
                res.setHeader('Content-Type', 'text/markdown');
                return await this.config.handleGetRequest(req, res, stats);
            case 'post':
                if(this.isFormRequest(req)) {
                    if(typeof this.config.handleFormRequest !== "function")
                        throw new Error(".handleFormRequest is not implemented for FORM POST " + this.routePath);
                    return await this.handleFormRequest(req, res, this.config.handleFormRequest, stats);
                }
                if(typeof this.config.handlePostRequest !== "function")
                    throw new Error(".handlePostRequest is not implemented for POST " + this.routePath);
                return await this.config.handlePostRequest(req, res, stats);
            }
        } catch (err) {
            console.error("Error submitting form: ", err);
            // res.statusMessage = err.message;
            return res.status(400).send(err.message);
        }
    }



    // static handleRequest() {
    //     module.exports = (req, res) => new (this.constructor)().handleRequest(req, res).then();
    // }

    isFormRequest(req) {
        return (req.headers['handler-type']||'').toLowerCase() === 'form';
    }



    async handleFormRequest(req, res, formHandlerCallback, stats={}) {
        let markdownPath = req.headers['content-path'];
        if (!markdownPath)
            throw new Error("Missing header: content-path");
        markdownPath = path.join(process.env.REACT_APP_PATH_CONTENT, markdownPath);

        let formPosition = req.headers['form-position'];
        if(!formPosition)
            throw new Error("Missing header: form-position");
        if (Number.isNaN(Number.parseInt(formPosition)))
            throw new Error("Invalid integer: formPosition");
        formPosition = Number.parseInt(formPosition);

        let formPreview = (req.headers['form-preview']||'').toLowerCase() !== 'false';

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
        const callback = await formHandlerCallback(form, req, stats);
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
        if (formPreview)
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
    }

}
