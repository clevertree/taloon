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
        if(this.props.autofill || this.props["data-autofill"])
            this.doAutoFill();

        if(this.props.autosubmit || this.props["data-autosubmit"])
            this.doAutoSubmit();
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
                {this.state.message ? <div className="message" children={this.state.message} /> : null }
                {this.state.error ? <div className="error" children={this.state.error} /> : null }
                {children}
            </form>
        </FormContext.Provider>;
    }



    async onSubmit(e, preview=false) {
        e && e.preventDefault();
        const form = this.ref.form.current;
        const formAction = path.resolve(path.dirname(this.props.markdownPath), form.getAttribute('action'));
        const formValues = this.getFormValues(form);
        const formPosition = this.getFormPosition(form);

        let postURL = new URL(formAction, process.env.REACT_APP_API_ENDPOINT);
        postURL.search = `markdownPath=${this.props.markdownPath}&formPosition=${formPosition}${preview ? '&preview=true' : ''}`;
        // console.log("Submitting form ", postURL + '', formValues, form);

        let newState = {
            processing: true,
            message: null,
            // validations: {}, // Don't clear validations until submission is finished
            // showErrors: !preview
        }
        this.setState(newState);

        try {
            const response = await fetch(postURL + '', {
                credentials: "include",
                method: 'post',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(formValues)
            });
            newState = await response.json();
            // console.log(`${preview ? "Preview " : ""}Response: `, newState, response);
        } catch (err) {
            newState.validations = {_: "Invalid JSON Response: " + err.message};
        }
        newState.processing = false;


        if(!preview) {
            form.scrollIntoView();
            if(newState.success === true) {
                AppEvents.emit('form:success', newState)
            } else {
                AppEvents.emit('form:failed', newState)
                if(!newState.error) {
                    const validationString = Object.values(newState.validations || {}).join("\n");
                    newState.error = validationString || "Form submission was unsuccessful";
                }
                console.warn(newState.error, newState);
            }
            if(newState.showModal) {
                AppEvents.emit('app:showModal', newState.showModal);
            }
        }
        this.setState(newState);
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

    doAutoFill() {
        // TODO: use localStorage
        const form = this.ref.form.current;
        const urlParams = new URLSearchParams(window.location.search);
        for(const field of form.elements) {
            if (field.name)  {
                switch(this.props.autofill) {
                    default:
                        const paramValue = urlParams.get(field.name);
                        if(paramValue)
                            field.value = paramValue;
                        break;
                }

            }
        }
    }

    doAutoSubmit() {
        this.onSubmit()
    }
}
