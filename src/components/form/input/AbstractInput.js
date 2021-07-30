import React from "react";
import {FormContext} from "../FormContext";
import {valid} from "semver";

export default class AbstractInput extends React.Component {
    constructor(props) {
        super(props);
        this.cb = {
            // onChange: e => this.onChange(e)
        }
        this.state = {
            value: this.props.defaultValue
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        // Component doesn't change. form state does
    }

    /**
     * @returns {JSX.Element}
     */
    render() {
        return <FormContext.Consumer>
            {(form) => {
                let validation = "", validations = form.state.validations || {};
                if (this.props.name) {
                    if (validations[this.props.name])
                        validation = validations[this.props.name];
                }
                // console.log('formState', formState, {validation});
                return this.renderContainer(validation);
            }}
        </FormContext.Consumer>
    }

    renderContainer(validation) {
        let validationClass = "validation-container";
        if(validation)
            validationClass += ' invalid';
        return <div className={validationClass}>
            {this.renderInput(validation)}
            <div className="validation-text">{validation}</div>
        </div>;
    }

    renderInput(validation) {
        throw new Error("Unimplemented");
    }

    getPlaceholder() {
        if(!this.props.placeholder)
            return null;
        return this.props.placeholder.toString().replaceAll('\\n', "\n");
    }
    // onChange(e) {
    //     console.log('e.target.value', e.target.value);
    //     this.setState({value: e.target.value})
    // }
}