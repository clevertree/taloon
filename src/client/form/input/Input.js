import React from "react";
import AbstractInput from "./AbstractInput";

export default class Input extends AbstractInput {
    /**
     * @param validation
     * @returns {JSX.Element}
     */
    renderInput(validation) {
        const props = {...this.props};
        if(typeof props.value !== "undefined") {
            props.defaultValue = props.value;
            delete props.value;
        }
        return <input
            {...props}
            placeholder={this.getPlaceholder()}
            ref={ref => {
                ref && ref.setCustomValidity(validation)
            }}
            />;
    }

    renderContainer(validation) {
        if(this.props.type === 'hidden')
            return this.renderInput(validation);
        return super.renderContainer(validation);
    }
}


