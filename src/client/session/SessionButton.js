import React from "react";
import AppEvents from "../event/AppEvents";
import ContentUtil from "../../util/ContentUtil";
import './SessionButton.css';
import SiteConfig from "../../util/ContentUtil";


export default class SessionButton extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            email: null,
            isActive: false
        };
        this.cb = {
            updateSession: e => this.updateSession(),
            showLoginModal: e => this.showLoginModal(e),
            showLogoutModal: e => this.showLogoutModal(e),
        }
        this.ref = {
            button: React.createRef()
        }
    }

    componentDidMount() {
        this.updateSession().then();
        AppEvents.addEventListener('session:change', this.cb.updateSession)
    }

    componentWillUnmount() {
        AppEvents.removeEventListener('session:change', this.cb.updateSession)
    }

    async updateSession() {
        const {PATH_USER_SESSION} = await SiteConfig.fetchDefaultConfig()
        const postURL = new URL(PATH_USER_SESSION, process.env.REACT_APP_API_ENDPOINT).toString();
        const response = await fetch(postURL + '', {
            credentials: "include",
            method: 'post',
            headers: {'Content-Type': 'application/json'},
        });
        const responseJson = await response.json();
        console.log('session', postURL, responseJson);
        this.setState(responseJson);

        const forInput = this.props.for || this.props.htmlFor;
        if(forInput) {
            const body = this.ref.button.current.closest('form, body');
            const elmInput = body.querySelector(`input[name="${forInput}"]`);
            if(!elmInput.value)
                elmInput.value = responseJson.email;
        }
    }

    // renderContainer(validation) {
    //     return this.renderInput(validation);
    // }

    getClassName() { return 'button location-button'; }

    render() {
        let className = this.getClassName();
        if(this.props.className)
            className += ' ' + this.props.className;
        return <a
            href="?"
            className={className}
            ref={this.ref.button}
            defaultValue={this.props.value}
            onClick={this.state.isActive ? this.cb.showLogoutModal : this.cb.showLoginModal}
            children={this.state.isActive ?  "Log out" : "Log in"}
        />;
    }

    async showLoginModal(e) {
        const {PATH_USER_LOGIN} = await ContentUtil.fetchDefaultConfig();
        e.preventDefault();
        AppEvents.emit('modal:show', PATH_USER_LOGIN);
    }
    async showLogoutModal(e) {
        const {PATH_USER_LOGOUT} = await ContentUtil.fetchDefaultConfig();
        e.preventDefault();
        AppEvents.emit('modal:show', PATH_USER_LOGOUT);
    }

}

