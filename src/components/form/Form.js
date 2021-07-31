import React from "react";
import {FormContext} from "./FormContext";
import AppEvents from "../event/AppEvents";
import path from "path";
import "./Form.css";

const TIMEOUT_CHANGE = 1000;


export default class Form extends React.Component {

    constructor(props) {
        super(props);
        this.cb = {
            onSubmit: e => this.onSubmit(e),
            onChange: e => this.onChangeDelay(e)
        }
        this.ref = {
            form: React.createRef()
        }
        this.state = {
            processing: false,
            validations: {
                '@session_required': 'Please login to complete this form'
            },
            message: null,
        }
        this.onChangeTimeout = null;
    }

    getClassName() { return 'theme-default'; }

    componentDidMount() {
       // this.doAutoFill(this.props.autofill || this.props["data-autofill"]);
       this.doAutoSubmit(this.props.autosubmit || this.props["data-autosubmit"]);
    }

    render() {
        let className = this.getClassName();
        if(this.props.className)
            className += ' ' + this.props.className;

        let children = this.props.children;

        return <FormContext.Provider value={this}>
            <form
                action={this.props.action}
                className={className}
                ref={this.ref.form}
                onSubmit={this.cb.onSubmit}
                onChange={this.cb.onChange}
            >
                {this.state.message ? <div className={"message" + (this.state.success ? "" : " error")} children={this.state.message} /> : null }
                {children}
            </form>
        </FormContext.Provider>;
    }



    async onSubmit(e, preview=false) {
        clearTimeout(this.onChangeTimeout);
        e && e.preventDefault();
        const form = this.ref.form.current;
        let formAction = form.getAttribute('action');
        if(!formAction) {
            AppEvents.emit('modal:close', {})
            return;
        }
        formAction = path.resolve(path.dirname(this.props.markdownPath), formAction);
        const formValues = this.getFormValues(form);
        const formPosition = this.getFormPosition(form);

        let postURL = new URL(formAction, process.env.REACT_APP_API_ENDPOINT);
        postURL.search = `markdownPath=${this.props.markdownPath.split('?').shift()}&formPosition=${formPosition}${preview ? '&preview=true' : ''}`;
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
        try {
            const response = await fetch(postURL + '', {
                credentials: "include",
                method: 'post',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(formValues)
            });
            const responseJson = await response.json();
            console.log(`${preview ? "Preview " : ""}Response: `, responseJson, response);
            newState.message = responseJson.message;
            newState.success = response.status === 200;
            events = responseJson.events || [];
        } catch (err) {
            newState.message = `Invalid JSON Response: ${err.message}`;
            newState.success = false;
        }

        newState.processing = false;
        this.setState(newState);


        if(!preview) {
            form.scrollIntoView();
            if(newState.success === true) {
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

        for(const [eventName, eventData] of events) {
            AppEvents.emit(eventName, eventData);
        }
    }


    async onChangeDelay(e, timeout=TIMEOUT_CHANGE) {
        clearTimeout(this.onChangeTimeout);
        this.onChangeTimeout = setTimeout(() => this.onSubmit(e, true), timeout);
    }

    getFormPosition(form) {
        const bodyElm = form.closest('.markdown-body, body');
        const formElms = bodyElm.getElementsByTagName('form');
        return [...formElms].indexOf(form);
    }

    getFormValues(form) {
        return Object.values(form.elements).reduce((obj, field) => {
            if (field.name && typeof field.value !== "undefined")
                obj[field.name] = field.value;
            return obj;
        }, {});
    }

    // doAutoFill(fillValue) {
    //     if(!fillValue)
    //         return;
    //     // TODO: use localStorage
    //     const form = this.ref.form.current;
    //     const urlParams = new URLSearchParams(window.location.search);
    //     for(const field of form.elements) {
    //         if (field.name)  {
    //             switch(this.props.autofill) {
    //                 default:
    //                     const paramValue = urlParams.get(field.name);
    //                     if(paramValue)
    //                         field.value = paramValue;
    //                     break;
    //             }
    //
    //         }
    //     }
    // }

    doAutoSubmit(submitValue) {
        if(!submitValue)
            return;
        const form = this.ref.form.current;
        if(form.checkValidity()) {
            setTimeout(() => {
                this.onSubmit()
            }, submitValue || 1000);
        } else {
            console.warn("Form failed validation. Auto-submit canceled");
        }
    }
}
