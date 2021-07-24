import React from "react";
import AbstractInput from "./AbstractInput";

export default class Input extends AbstractInput {
    /**
     * @param validation
     * @returns {JSX.Element}
     */
    renderInput(validation) {
        return <input
            {...this.props}
            value={this.props.defaultValue}
            placeholder={(this.props.placeholder||'').toString().replaceAll('\\n', "\n")}
            ref={ref => {
                ref && ref.setCustomValidity(validation)
            }}
            />;
    }
}


