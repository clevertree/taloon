import React from "react";
import {FormContext} from "../FormContext";

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
            {(formState) => {
                let validation = "";
                if (this.props.name) {
                    if (formState.errors[this.props.name])
                        validation = formState.errors[this.props.name];
                }
                console.log('formState', formState, {validation});
                let validationClass = "validation-container";
                if(validation)
                    validationClass += ' invalid';
                return <div className={validationClass}>
                    {this.renderInput(validation)}
                    <div className="validation-text">{validation}</div>
                </div>;
                // TODO: prevent text rerender
            }}
        </FormContext.Consumer>
    }

    renderInput(validation) {
        throw new Error("Unimplemented");
    }

    // onChange(e) {
    //     console.log('e.target.value', e.target.value);
    //     this.setState({value: e.target.value})
    // }
}