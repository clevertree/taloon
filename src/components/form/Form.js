import React from "react";
import "./Form.css";

export default class Form extends React.Component {

    constructor(props) {
        super(props);
        this.cb = {
            onSubmit: e => this.onSubmit(e)
        }
        this.ref = {
            form: React.createRef()
        }
        this.state = {
            processing: false,
            error: null,
            message: null,
        }
    }

    getClassName() { return 'theme-default'; }

    render() {
        let className = this.getClassName();
        if(this.props.className)
            className += ' ' + this.props.className;
        return <form
            {...this.props}
            className={className}
            ref={this.ref.form}
            onSubmit={this.cb.onSubmit}
        >
            <div className="message" children={this.state.message} />
            <div className="error" children={this.state.error} />
            {this.props.children}
        </form>;
    }

    async onSubmit(e) {
        e.preventDefault();
        const form = this.ref.form.current;
        let formName = form.getAttribute('name');
        if(!formName) {
            const forms = [...document.querySelectorAll('form')];
            formName = forms.indexOf(form);
        }

        const values = Object.values(form).reduce((obj,field) => {
            if(field.name)
                obj[field.name] = field.value;
            return obj;
        }, {})

        let postURL = new URL(window.location.href);
        if(process.env.REACT_APP_API_PORT)
            postURL.port = process.env.REACT_APP_API_PORT;
        postURL.search = 'formName='+formName;
        console.log("Submitting form ", postURL + '', form, values);

        let error = null;
        let message = "Submitting form";
        this.setState({
            processing: true,
            error,
            message,
        })
        try {
            const response = await fetch(postURL + '', {
                method: 'post',
                headers: {
                    'Content-Type': 'application/json'
                    // 'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: JSON.stringify(values)
            });
            const responseJSON = await response.json();
            console.log("Response: ", response, responseJSON);
            if(response.status !== 200)
                throw new Error(`(${response.status}) ${response.statusText}`)
            message = responseJSON.message || "Submission Successful";
        } catch (err) {
            error = "Submission Failed. " + err.message;
            message = null;
        }
        this.setState({
            processing: false,
            error,
            message
        })

        form.scrollIntoView()
    }
}


