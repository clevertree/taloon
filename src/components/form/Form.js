import React from "react";
import {FormContext} from "./FormContext";
import AppEvents from "../event/AppEvents";
import path from "path";
import "./Form.css";

const TIMEOUT_CHANGE = 1000;
const TIMEOUT_AUTOFILL = 1;


export default class Form extends React.Component {

    constructor(props) {
        super(props);
        this.cb = {
            onSubmit: this.onSubmit.bind(this),
            onChange: this.onChangeDelay.bind(this),
            onRedirect: this.onRedirect.bind(this)
        }
        this.ref = {
            form: React.createRef()
        }
        this.state = {
            processing: false,
            validations: {},
            message: null,
            status: 200,
        }
        this.timeouts = {
            onChange: null,
            autoFill: null
        }
    }

    getClassName() { return 'theme-default'; }

    componentDidMount() {
        AppEvents.addEventListener('session:change', this.cb.onChange);
        AppEvents.addEventListener('redirect', this.cb.onRedirect);
        this.doAuto();
        this.cb.onChange();
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if(prevProps.markdownPath !== this.props.markdownPath) {
            this.doAuto();
            if(this.state.message)
                this.setState({
                    message: null,
                    status: 200,
                    processing: false,
                    validation: {}
                })
        }
    }

    componentWillUnmount() {
        AppEvents.removeEventListener('session:change', this.cb.onChange);
        AppEvents.removeEventListener('redirect', this.cb.onRedirect);
        this.clearTimeouts();
    }

    render() {
        let className = this.getClassName();
        if(this.props.className)
            className += ' ' + this.props.className;

        let children = this.props.children;

        return <FormContext.Provider value={this.state}>
            <form
                action={this.props.action}
                className={className}
                ref={this.ref.form}
                onSubmit={this.cb.onSubmit}
                onChange={this.cb.onChange}
            >
                {this.state.message ? <div className={"message" + (this.state.status === 200 ? "" : " error")} children={this.state.message} /> : null }
                {this.state.redirectredirectingTimeout ? <div className={"message redirecting"} children={`Redirecting in ${this.state.redirectingTimeout/1000} seconds...`} /> : null }
                {children}
            </form>
        </FormContext.Provider>;
    }



    async onSubmit(e, preview=false) {
        this.clearTimeouts();
        e && e.preventDefault();
        const form = this.ref.form.current;
        let formAction = form.getAttribute('action');
        if(!formAction) {
            if(!preview)
                AppEvents.emit('modal:close', 500)
            return;
        }
        const baseURL = new URL(this.props.markdownPath, process.env.REACT_APP_API_ENDPOINT)+'';
        const postURL = new URL(formAction, baseURL)+'';
        const formValues = this.getFormValues();
        // const formPosition = this.getFormPosition();

        // let postURL = new URL(formAction, process.env.REACT_APP_API_ENDPOINT);
        // const formPath = this.props.markdownPath.split('?').shift();
        // postURL.search = `markdownPath=${this.props.markdownPath.split('?').shift()}&formPosition=${formPosition}${preview ? '&preview=true' : ''}`;
        // console.log("Submitting form ", postURL + '', formValues, form);

        let newState = {
            processing: true,
            message: null,
            success: null,
            // validations: {}, // Don't clear validations until submission is finished
            // showErrors: !preview
        }
        this.setState(newState);

        let events = [];
        let valueChanges = {};
        try {
            const response = await fetch(postURL, {
                credentials: "include",
                method: 'post',
                headers: {
                    'Content-Type': 'application/json',
                    // 'Handler-Type': 'form',
                    // 'Content-Path': this.props.markdownPath,
                    // 'Form-Position': formPosition,
                    'Form-Preview': preview ? 'true' : 'false',
                },
                body: JSON.stringify(formValues)
            });
            let responseJson;
            if(response.headers.get('content-type').startsWith('application/json'))
                responseJson = await response.json();
            else
                responseJson = await response.text();
            if(typeof responseJson === "string")
                responseJson = {message: responseJson};
            console.log(`${preview ? "Preview " : ""}Response: `, responseJson, response);
            newState.message = responseJson.message;
            newState.status = response.status;
            newState.validations = responseJson.validations || {}; // TODO: not triggering refresh

            events = responseJson.events || [];
            valueChanges = responseJson.valueChanges || {};
        } catch (err) {
            newState.message = `Invalid JSON Response: ${err.message}`;
            newState.status = false;
        }

        newState.processing = false;
        this.setState(newState);


        if(!preview) {
            form.scrollIntoView();
            if(newState.status === 200) {
                this.clearFormStorage();
                AppEvents.emit('form:success', newState)
            } else {
                AppEvents.emit('form:failed', newState)
                if(!newState.message) {
                    const validationString = Object.values(newState.validations || {}).join("\n");
                    newState.message = validationString || "Form submission was unsuccessful";
                }
                console.warn(newState.message, newState);
            }
        }

        // Update values
        for(const key in valueChanges)
            if(valueChanges.hasOwnProperty(key))
                if(form.elements[key])
                    form.elements[key].value = valueChanges[key];
                else
                    console.warn("Form field not found: " + key, form);

        // Send events
        for(const [eventName, ...eventArgs] of events)
            AppEvents.emit(eventName, ...eventArgs);
    }


    async onChangeDelay(e, timeout=TIMEOUT_CHANGE) {
        clearTimeout(this.timeouts.onChange);
        this.timeouts.onChange = setTimeout(() => {
            this.saveFormToStorage();
            this.onSubmit(e, true)
        }, timeout);
    }

    onRedirect(path, timeout) {
        if(timeout) {
            const interval = setInterval(() => {
                timeout -= 1000;
                if(timeout < 0) {
                    timeout = null;
                    clearInterval(interval);
                }
                this.setState({
                    redirectingTimeout: timeout
                })
            }, 1000)
        }
        // console.log('redirect', ...arguments)
    }

    // getFormPosition() {
    //     const form = this.ref.form.current;
    //     const bodyElm = form.closest('.markdown-body, body');
    //     const formElms = bodyElm.getElementsByTagName('form');
    //     return [...formElms].indexOf(form);
    // }

    getFormValues() {
        const form = this.ref.form.current;
        if(!form)
            throw new Error("Form is no longer active");
        return Object.values(form.elements).reduce((obj, field) => {
            if (field.name && typeof field.value !== "undefined")
                obj[field.name] = field.value;
            return obj;
        }, {});
    }

    doAuto(timeout=TIMEOUT_AUTOFILL) {
        this.timeouts.autoFill = setTimeout(() => {
            this.doAutoFill(this.props.autofill || this.props["data-autofill"]);
            this.doAutoSubmit(this.props.autosubmit || this.props["data-autosubmit"]);
        }, timeout);
    }

    doAutoFill(fillValue) {
        const actionPath = this.getFormActionPath();
        let values = actionPath ? loadFormData(actionPath) : {};

        switch(fillValue) {
            default:
            case 'search':
                Object.assign(values, Object.fromEntries(new URLSearchParams(document.location.search)))
                break;
        }

        const form = this.ref.form.current;
        for(const field of form.elements) {
            if (!field.value && field.name && values[field.name]) {
                field.value = values[field.name];
                delete values[field.name];
                // if(process.env.NODE_ENV === 'development')
                //     console.log("Auto-filling value ", field.name, field.value);
            }
        }
        if(Object.values(values) > 0)
            console.warn("Unused values were not added to form: ", values);
    }

    doAutoSubmit(submitValue) {
        if(!submitValue)
            return;
        const form = this.ref.form.current;
        if(!form) throw new Error("Form is unavailable")
        if(form.checkValidity()) {
            setTimeout(() => {
                this.onSubmit()
            }, submitValue || 1000);
        } else {
            console.warn("Form failed validation. Auto-submit canceled");
        }
    }

    saveFormToStorage() {
        const autoSaveValue = this.props.autosave || this.props["data-autosave"];
        if((autoSaveValue||'').toLowerCase() === 'off') // !autoSaveValue ||
            return;
        const values = this.getFormValues();
        const actionPath = this.getFormActionPath();
        if(actionPath)
            storeFormData(actionPath, values);
    }

    clearFormStorage() {
        const actionPath = this.getFormActionPath();
        if(actionPath)
            clearFormData(actionPath);
    }

    clearTimeouts() {
        for(const key in this.timeouts)
            if(this.timeouts.hasOwnProperty(key))
                clearTimeout(this.timeouts[key]);
    }

    getFormActionPath() {
        const form = this.ref.form.current;
        if(!form)
            throw new Error("Form is unavailable")
        const action = form.getAttribute('action');
        if(!action)
            return null;
        const markdownDir = path.dirname(this.props.markdownPath);
        if(!markdownDir)
            throw new Error("Invalid Markdown directory: " + this.props.markdownPath);
        return path.resolve(markdownDir, action)
    }
}

AppEvents.addEventListener('form:save', storeFormData);

function storeFormData(actionPath, values) {
    const key = 'form:' + actionPath;
    localStorage.setItem(key, JSON.stringify(values));
    // if(process.env.NODE_ENV === 'development')
    //     console.log("Storing Form Values: ", key, values);
}

function clearFormData(actionPath) {
    const key = 'form:' + actionPath;
    localStorage.removeItem(key);
    if(process.env.NODE_ENV === 'development')
        console.log("Removing Form Values: ", key);
}


function loadFormData(actionPath) {
    if(!localStorage)
        return {};

    const key = 'form:' + actionPath;
    let formData = localStorage.getItem(key);
    let values = {};
    if (formData)
        values = JSON.parse(formData);
    if(process.env.NODE_ENV === 'development')
        console.log("Loading Form Values: ", key, values);
    return values;
}