import React from "react";

import "./Modal.css";

export default class LoginModal extends React.Component {
    render() {
        return <fieldset {...this.props} >
            <legend>
                Login
            </legend>
            <button>Login</button>
        </fieldset>
    }
}