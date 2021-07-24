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
            errors: {},
            showErrors: false,
            message: null,
        }
        this.onChangeTimeout = null;
    }

    getClassName() { return 'theme-default'; }

    render() {
        let content = this.renderForm();
        if(this.state.errors['@session_required'])
            content = [
                content,
                <div className="Login window"/>
            ];

        return content;
    }

    renderForm() {
        let className = this.getClassName();
        if(this.props.className)
            className += ' ' + this.props.className;

        return <FormContext.Provider value={this.state}>
            <form
                {...this.props}
                className={className}
                ref={this.ref.form}
                onSubmit={this.cb.onSubmit}
                onChange={this.cb.onChange}
            >
                <div className="message" children={this.state.message} />
                {this.state.showErrors ? Object.keys(this.state.errors).map(key => <div key={key} className="error" children={this.state.errors[key]} />) : null}
                {this.props.children}
            </form>
        </FormContext.Provider>;
    }



    async onSubmit(e, preview=false) {
        e.preventDefault();
        const form = this.ref.form.current;
        let formName = this.getFormName(form);
        const formValues = this.getFormValues(form);

        let postURL = new URL(window.location.href);
        if(process.env.REACT_APP_API_PORT)
            postURL.port = process.env.REACT_APP_API_PORT;
        postURL.search = `formName=${formName}${preview ? '&preview=true' : ''}`;
        console.log("Submitting form ", postURL + '', form, formValues);

        let newState = {
            processing: true,
            message: null,
            errors: {},
            showErrors: !preview
        }
        this.setState(newState);

        try {
            const response = await fetch(postURL + '', {
                method: 'post',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(formValues)
            });
            newState = await response.json();
            console.log(`${preview ? "Preview " : ""}Response: `, response, newState);
        } catch (err) {
            newState.errors = {_: "Invalid JSON Response: " + err.message};
        }
        newState.processing = false;
        this.setState(newState);


        // Element Validations
        // this.setCustomValidations(form, newState.errors || {});
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


