import React from "react";
import {FormContext} from "../FormContext";

export default class Input extends React.Component {
    render() {
        return <FormContext.Consumer>
            {(formState) => {
                let validation = "";
                let className = this.props.className || '';
                if(this.props.name) {
                    if(formState.errors[this.props.name])
                        validation = formState.errors[this.props.name];
                }
                if(validation) {
                    className += (className ? ' ' : '') + 'invalid';
                }
                console.log('formState', formState, {validation});
                return <input {...this.props}
                              defaultValue={this.props.value}
                              className={className}
                              ref={ref => {
                                ref && ref.setCustomValidity(validation)
                              }}
                              />;
            }}
        </FormContext.Consumer>
    }
}

