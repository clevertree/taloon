import React from "react";
import AbstractInput from "../input/AbstractInput";
import AppEvents from "../../event/AppEvents";
import './SessionButton.css';

export default class SessionButton extends AbstractInput {
    constructor(props) {
        super(props);
        this.state.email = null;
        this.state.isActive = false;
        this.cb = {
            updateSession: e => this.updateSession(),
            showLoginModal: e => this.showLoginModal(e),
            showLogoutModal: e => this.showLogoutModal(e),
        }
    }

    componentDidMount() {
        this.updateSession()
        AppEvents.addEventListener('session:change', this.cb.updateSession)
    }

    componentWillUnmount() {
        AppEvents.removeEventListener('session:change', this.cb.updateSession)
    }

    async updateSession() {
        const postURL = new URL('session', process.env.REACT_APP_API_ENDPOINT).toString();
        const response = await fetch(postURL + '', {
            credentials: "include",
            method: 'post',
            headers: {'Content-Type': 'application/json'},
        });
        const responseJson = await response.json();
        // console.log('session', postURL, responseJson);
        this.setState(responseJson);
    }

    renderContainer(validation) {
        return this.renderInput(validation);
    }

    /**
     * @param validation
     * @returns {JSX.Element}
     */
    renderInput(validation) {
        if(this.state.isActive) {
            return <>
                <div className="session-button-email">{this.state.email}</div>
                <button {...this.props}
                    className={"session-button small"}
                    defaultValue={this.props.value}
                    placeholder={this.getPlaceholder()}
                    onClick={this.cb.showLogoutModal}
                    children={"Log Out" }
                />
            </>;
        } else {
            return <button {...this.props}
                           className={"session-button wide"}
                           defaultValue={this.props.value}
                           placeholder={this.getPlaceholder()}
                           onClick={this.cb.showLoginModal}
                           children={"Log in"}
            />;
        }
    }

    showLoginModal(e) {
        e.preventDefault();
        AppEvents.emit('modal:show', `${process.env.REACT_APP_PATH_SITE}/user/login.md`);
    }
    showLogoutModal(e) {
        e.preventDefault();
        AppEvents.emit('modal:show', `${process.env.REACT_APP_PATH_SITE}/user/logout.md`);
    }

}

