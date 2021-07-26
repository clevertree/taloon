import React from "react";
import {FormContext} from "./FormContext";
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

    render() {
        let className = this.getClassName();
        if(this.props.className)
            className += ' ' + this.props.className;

        let children = this.props.children;

        return <FormContext.Provider value={this.state}>
            <form
                {...this.props}
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
        e.preventDefault();
        const form = this.ref.form.current;
        let formName = this.getFormName(form);
        const formValues = this.getFormValues(form);

        let postURL = new URL(':form-submit', process.env.REACT_APP_API_ENDPOINT);
        postURL.search = `path=${window.location.pathname}&name=${formName}${preview ? '&preview=true' : ''}`;
        console.log("Submitting form ", postURL + '', formValues, form);

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
            console.log(`${preview ? "Preview " : ""}Response: `, newState, response);
        } catch (err) {
            newState.validations = {_: "Invalid JSON Response: " + err.message};
        }
        newState.processing = false;
        this.setState(newState);


        // Element Validations
        // this.setCustomValidations(form, newState.validations || {});
        if(!preview)
            form.scrollIntoView();
    }


    async onChangeDelay(e, timeout=TIMEOUT_CHANGE) {
        clearTimeout(this.onChangeTimeout);
        this.onChangeTimeout = setTimeout(() => this.onSubmit(e, true), timeout);
    }


    getFormName(form) {
        let formName = form.getAttribute('name');
        if(!formName) {
            const forms = [...document.querySelectorAll('form')];
            formName = forms.indexOf(form);
        }
        return formName;
    }

    getFormValues(form) {
        return Object.values(form).reduce((obj, field) => {
            if (field.name)
                obj[field.name] = field.value;
            return obj;
        }, {});
    }
}
