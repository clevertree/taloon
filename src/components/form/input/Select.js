import React from "react";
import AbstractInput from "./AbstractInput";

export default class Select extends AbstractInput {
    /**
     * @param validation
     * @returns {JSX.Element}
     */
    renderInput(validation) {
        return <select {...this.props}
                       defaultValue={this.props.value}
                       placeholder={(this.props.placeholder||'').toString().replaceAll('\\n', "\n")}
                />;
    }
}