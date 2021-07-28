import React from "react";
import AbstractInput from "../input/AbstractInput";
import {AppContext} from "../../../App";

export default class Session extends AbstractInput {
    constructor(props) {
        super(props);
        this.state.email = null;
        this.state.isActive = false;
    }

    componentDidMount() {
        this.updateSession()
    }

    async updateSession() {
        const postURL = new URL('session', process.env.REACT_APP_API_ENDPOINT).toString();
        const response = await fetch(postURL + '', {
            credentials: "include",
            method: 'post',
            headers: {'Content-Type': 'application/json'},
        });
        const responseJson = await response.json();
        console.log('session', postURL, responseJson);
        this.setState(responseJson);
    }

    /**
     * @param validation
     * @returns {JSX.Element}
     */
    renderInput(validation) {
        return <AppContext.Consumer>
            {(app) => {
                if(this.state.isActive) {
                    return <div className="session-email">${this.state.email}</div>
                } else {
                    return <button {...this.props}
                                   defaultValue={this.props.value}
                                   placeholder={(this.props.placeholder||'').toString().replaceAll('\\n', "\n")}
                                   onClick={e => this.onClick(e, app)}
                                   children={"Login"}
                    />;
                }
            }}
        </AppContext.Consumer>
    }

    async onClick(e, app) {
        e.preventDefault();
        await app.showModal('./site/modal/login.md');
        await this.updateSession();
    }
}

