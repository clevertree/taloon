import React from "react";
import AbstractInput from "./AbstractInput";

export default class TextArea extends AbstractInput {
    /**
     * @param validation
     * @returns {JSX.Element}
     */
    renderInput(validation) {
        return <textarea {...this.props}
                         defaultValue={this.props.value}
                         placeholder={this.getPlaceholder()}
                         children={null}
                         />;
    }
}

