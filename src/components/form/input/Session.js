import React from "react";
import AbstractInput from "./AbstractInput";

export default class Session extends AbstractInput {
    constructor(props) {
        super(props);
        this.state.session = null;
    }

    componentDidMount() {
        const postURL = new URL(':session', process.env.REACT_APP_API_ENDPOINT).toString();
        console.log('postURL', postURL);
    }

    /**
     * @param validation
     * @returns {JSX.Element}
     */
    renderInput(validation) {
        return <button {...this.props}
                         defaultValue={this.props.value}
                         placeholder={(this.props.placeholder||'').toString().replaceAll('\\n', "\n")}
                         children={"Login"}
                         />;
    }
}

